-- Apply in Supabase SQL editor for independent faction selection.
begin;
create or replace function public.kuban_choose_faction(p_room_id uuid,p_faction text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or p_faction is null or p_faction not in ('kaz','nov','mon','bog') then raise exception 'Invalid faction'; end if;
 if not exists(select 1 from public.kuban_rooms where id=p_room_id and status='waiting') then raise exception 'No waiting room'; end if;
 update public.kuban_players set nickname=left(regexp_replace(nickname,'~[a-z0-9_-]+$',''),14)||'~'||p_faction, ready=false
 where room_id=p_room_id and user_id=auth.uid();
 if not found then raise exception 'Not a member'; end if;
end $$;
revoke all on function public.kuban_choose_faction(uuid,text) from public;
grant execute on function public.kuban_choose_faction(uuid,text) to authenticated;
commit;
