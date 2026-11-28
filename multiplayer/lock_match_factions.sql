create or replace function public.kuban_lock_match_factions() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare h text; g text;
begin
 if new.config->>'protocol' not in ('128','130','131') then return new; end if;
 select substring(nickname from '~(kaz|nov|mon|bog)$') into h from public.kuban_players where room_id=new.room_id and user_id=new.host_id;
 select substring(nickname from '~(kaz|nov|mon|bog)$') into g from public.kuban_players where room_id=new.room_id and user_id=new.guest_id;
 if h is null or g is null then raise exception 'Both players must confirm faction'; end if;
 new.config:=new.config||jsonb_build_object('hostRace',h,'guestRace',g);
 return new;
end $$;
drop trigger if exists kuban_lock_match_factions on public.kuban_matches;
create trigger kuban_lock_match_factions before insert on public.kuban_matches for each row execute function public.kuban_lock_match_factions();