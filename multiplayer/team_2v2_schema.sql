-- Kuban War: additive 2v2 backend foundation.
-- Do not apply until the 2v2 client integration is ready. Existing 1v1 RPCs are unchanged.
begin;
create table if not exists public.kuban_team_choices (
  room_id uuid not null references public.kuban_rooms(id) on delete cascade,
  user_id uuid not null,
  side smallint not null check (side in (0,1)),
  faction text not null check (faction in ('kaz','nov','mon','bog')),
  primary key(room_id,user_id)
);
create table if not exists public.kuban_team_match_players (
  match_id uuid not null references public.kuban_matches(id) on delete cascade,
  user_id uuid not null,
  slot smallint not null check(slot in (0,1,3,4)),
  side smallint not null check(side in (0,1)),
  faction text not null check(faction in ('kaz','nov','mon','bog')),
  check ((slot in (0,3) and side=0) or (slot in (1,4) and side=1)),
  primary key(match_id,user_id), unique(match_id,slot)
);
create table if not exists public.kuban_team_commands (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.kuban_matches(id) on delete cascade,
  sender_id uuid not null,
  seq bigint not null check(seq between 1 and 2147483647),
  kind text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique(match_id,sender_id,seq)
);
create index if not exists kuban_team_commands_match_idx on public.kuban_team_commands(match_id,id);
create table if not exists public.kuban_team_signals (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.kuban_matches(id) on delete cascade,
  sender_id uuid not null,
  recipient_id uuid not null,
  epoch integer not null check(epoch>0),
  kind text not null check(kind in ('offer','answer','ice')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists kuban_team_signals_recipient_idx on public.kuban_team_signals(match_id,recipient_id,id);
create table if not exists public.kuban_team_frames (
  match_id uuid not null references public.kuban_matches(id) on delete cascade,
  recipient_id uuid not null,
  seq bigint not null check(seq>0),
  ack_seq bigint not null default 0 check(ack_seq>=0),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key(match_id,recipient_id)
);
alter table public.kuban_team_choices enable row level security;
alter table public.kuban_team_match_players enable row level security;
alter table public.kuban_team_commands enable row level security;
alter table public.kuban_team_signals enable row level security;
alter table public.kuban_team_frames enable row level security;
revoke all on public.kuban_team_choices,public.kuban_team_match_players,public.kuban_team_commands,public.kuban_team_signals,public.kuban_team_frames from anon,authenticated;
grant select on public.kuban_team_choices,public.kuban_team_match_players,public.kuban_team_commands,public.kuban_team_signals,public.kuban_team_frames to authenticated;
drop policy if exists team_choices_read on public.kuban_team_choices;
create policy team_choices_read on public.kuban_team_choices for select to authenticated using (
  exists(select 1 from public.kuban_players p where p.room_id=kuban_team_choices.room_id and p.user_id=auth.uid())
);
drop policy if exists team_roster_read on public.kuban_team_match_players;
create policy team_roster_read on public.kuban_team_match_players for select to authenticated using (
  exists(select 1 from public.kuban_matches m join public.kuban_players p on p.room_id=m.room_id where m.id=kuban_team_match_players.match_id and p.user_id=auth.uid())
);
drop policy if exists team_commands_read on public.kuban_team_commands;
create policy team_commands_read on public.kuban_team_commands for select to authenticated using (
  sender_id=auth.uid() or exists(select 1 from public.kuban_matches m where m.id=kuban_team_commands.match_id and m.host_id=auth.uid())
);
drop policy if exists team_signals_read on public.kuban_team_signals;
create policy team_signals_read on public.kuban_team_signals for select to authenticated using (
  sender_id=auth.uid() or recipient_id=auth.uid()
);
drop policy if exists team_frames_read on public.kuban_team_frames;
create policy team_frames_read on public.kuban_team_frames for select to authenticated using (
  recipient_id=auth.uid() or exists(select 1 from public.kuban_matches m where m.id=kuban_team_frames.match_id and m.host_id=auth.uid())
);

create or replace function public.kuban_team_choose(p_room_id uuid,p_side integer,p_faction text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_room public.kuban_rooms%rowtype;
begin
  if v_uid is null or p_side is null or p_side not in (0,1) or p_faction is null or p_faction not in ('kaz','nov','mon','bog') then raise exception 'Invalid selection'; end if;
  select * into v_room from public.kuban_rooms where id=p_room_id for update;
  if not found or v_room.max_players<>4 or v_room.status<>'waiting' then raise exception 'No waiting 2v2 room'; end if;
  if not exists(select 1 from public.kuban_players where room_id=p_room_id and user_id=v_uid) then raise exception 'Not a member'; end if;
  if (select count(*) from public.kuban_team_choices c join public.kuban_players p on p.room_id=c.room_id and p.user_id=c.user_id where c.room_id=p_room_id and c.side=p_side and c.user_id<>v_uid)>=2 then raise exception 'Team full'; end if;
  insert into public.kuban_team_choices(room_id,user_id,side,faction) values(p_room_id,v_uid,p_side,p_faction)
  on conflict(room_id,user_id) do update set side=excluded.side,faction=excluded.faction;
  update public.kuban_players set ready=false where room_id=p_room_id and user_id=v_uid;
end $$;

create or replace function public.kuban_team_start_match(p_room_id uuid,p_config jsonb default '{}'::jsonb)
returns public.kuban_matches language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_room public.kuban_rooms%rowtype; v_host_side smallint; v_guest uuid; v_match public.kuban_matches%rowtype; v_config jsonb;
begin
  select * into v_room from public.kuban_rooms where id=p_room_id for update;
  if not found or v_uid is null or v_room.host_id<>v_uid or v_room.max_players<>4 or v_room.status<>'waiting' then raise exception 'Only host of waiting 2v2 room can start'; end if;
  if (select count(*) from public.kuban_players where room_id=p_room_id)<>4 then raise exception 'Four players required'; end if;
  if exists(select 1 from public.kuban_players p left join public.kuban_team_choices c on c.room_id=p.room_id and c.user_id=p.user_id where p.room_id=p_room_id and (not coalesce(p.ready,false) or c.user_id is null)) then raise exception 'All players must select faction and ready'; end if;
  select side into v_host_side from public.kuban_team_choices where room_id=p_room_id and user_id=v_uid;
  if (select count(*) from public.kuban_team_choices c join public.kuban_players p on p.room_id=c.room_id and p.user_id=c.user_id where c.room_id=p_room_id and c.side=v_host_side)<>2 then raise exception 'Teams must contain two players each'; end if;
  select p.user_id into v_guest from public.kuban_players p join public.kuban_team_choices c on c.room_id=p.room_id and c.user_id=p.user_id where p.room_id=p_room_id and c.side<>v_host_side order by p.joined_at,p.user_id limit 1;
  v_config=jsonb_build_object('protocol',200,'mode','2v2','size',case when p_config->>'size' in ('0','1','2') then (p_config->>'size')::integer else 1 end,
    'gold',case when p_config->>'gold' in ('300','600','1200') then (p_config->>'gold')::integer else 600 end,
    'biome',case when p_config->>'biome' in ('0','1','2','3','random') then p_config->>'biome' else 'random' end,
    'neutral',coalesce(p_config->>'neutral','true')<>'false','seed',floor(random()*4294967296)::bigint);
  update public.kuban_matches set status='abandoned',updated_at=now() where room_id=p_room_id and status='running';
  insert into public.kuban_matches(room_id,host_id,guest_id,status,config) values(p_room_id,v_uid,v_guest,'running',v_config) returning * into v_match;
  insert into public.kuban_team_match_players(match_id,user_id,slot,side,faction)
    select v_match.id,p.user_id,
      case when p.user_id=v_uid then 0 when c.side=v_host_side then 3 when p.user_id=v_guest then 1 else 4 end,
      case when c.side=v_host_side then 0 else 1 end,c.faction
    from public.kuban_players p join public.kuban_team_choices c on c.room_id=p.room_id and c.user_id=p.user_id where p.room_id=p_room_id;
  update public.kuban_rooms set status='playing' where id=p_room_id;
  return v_match;
end $$;

create or replace function public.kuban_team_submit_command(p_match_id uuid,p_seq bigint,p_kind text,p_payload jsonb)
returns bigint language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_id bigint;
begin
  if v_uid is null or p_seq is null or p_seq not between 1 and 2147483647 or p_kind is null or p_kind not in ('issue','place','stop','formation','stance','train','upg','ability','slot','buildingUpgrade','perk','hstat','workerMode','rally','spyRecon','spySabotage','faction') or jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>65536 then raise exception 'Invalid command'; end if;
  if not exists(select 1 from public.kuban_matches m join public.kuban_team_match_players r on r.match_id=m.id join public.kuban_players p on p.room_id=m.room_id and p.user_id=r.user_id where m.id=p_match_id and m.status='running' and m.config->>'mode'='2v2' and r.user_id=v_uid) then raise exception 'Not an active participant'; end if;
  insert into public.kuban_team_commands(match_id,sender_id,seq,kind,payload) values(p_match_id,v_uid,p_seq,p_kind,p_payload) on conflict(match_id,sender_id,seq) do nothing returning id into v_id;
  if v_id is null then select id into v_id from public.kuban_team_commands where match_id=p_match_id and sender_id=v_uid and seq=p_seq; end if;
  return v_id;
end $$;

create or replace function public.kuban_team_signal(p_match_id uuid,p_recipient uuid,p_epoch integer,p_kind text,p_payload jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_host uuid;
begin
  if v_uid is null or p_recipient is null or p_recipient=v_uid or p_epoch is null or p_epoch<1 or p_kind is null or p_kind not in ('offer','answer','ice') or jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>65536 then raise exception 'Invalid signal'; end if;
  select host_id into v_host from public.kuban_matches where id=p_match_id and status='running' and config->>'mode'='2v2';
  if v_host is null or (v_uid<>v_host and p_recipient<>v_host) then raise exception 'Invalid route'; end if;
  if (select count(*) from public.kuban_team_match_players r join public.kuban_matches m on m.id=r.match_id join public.kuban_players p on p.room_id=m.room_id and p.user_id=r.user_id where r.match_id=p_match_id and r.user_id in (v_uid,p_recipient))<>2 then raise exception 'Invalid participants'; end if;
  insert into public.kuban_team_signals(match_id,sender_id,recipient_id,epoch,kind,payload) values(p_match_id,v_uid,p_recipient,p_epoch,p_kind,p_payload);
end $$;

create or replace function public.kuban_team_push_frame(p_match_id uuid,p_recipient uuid,p_seq bigint,p_ack bigint,p_payload jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if auth.uid() is null or p_seq is null or p_seq<1 or p_ack is null or p_ack<0 or jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>2000000 then raise exception 'Invalid frame'; end if;
  if not exists(select 1 from public.kuban_matches m join public.kuban_team_match_players r on r.match_id=m.id join public.kuban_players p on p.room_id=m.room_id and p.user_id=r.user_id where m.id=p_match_id and m.host_id=auth.uid() and m.status='running' and m.config->>'mode'='2v2' and r.user_id=p_recipient) then raise exception 'Only host may publish to a participant'; end if;
  insert into public.kuban_team_frames(match_id,recipient_id,seq,ack_seq,payload) values(p_match_id,p_recipient,p_seq,p_ack,p_payload)
  on conflict(match_id,recipient_id) do update set seq=excluded.seq,ack_seq=excluded.ack_seq,payload=excluded.payload,updated_at=now()
    where excluded.seq>kuban_team_frames.seq;
end $$;

revoke all on function public.kuban_team_choose(uuid,integer,text),public.kuban_team_start_match(uuid,jsonb),public.kuban_team_submit_command(uuid,bigint,text,jsonb),public.kuban_team_signal(uuid,uuid,integer,text,jsonb),public.kuban_team_push_frame(uuid,uuid,bigint,bigint,jsonb) from public,anon;
grant execute on function public.kuban_team_choose(uuid,integer,text),public.kuban_team_start_match(uuid,jsonb),public.kuban_team_submit_command(uuid,bigint,text,jsonb),public.kuban_team_signal(uuid,uuid,integer,text,jsonb),public.kuban_team_push_frame(uuid,uuid,bigint,bigint,jsonb) to authenticated;
commit;
