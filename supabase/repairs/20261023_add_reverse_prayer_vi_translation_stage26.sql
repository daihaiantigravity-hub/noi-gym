-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Add a reviewed Vietnamese translation after confirming the source sequence.
-- No exercise source fields are modified. This transaction is hash-guarded and rerunnable.
begin;
set local lock_timeout = '5s';
lock table public.exercises in share row exclusive mode;
lock table public.exercise_translations in share row exclusive mode;

do $verify_source$
begin
  if not exists (
    select 1 from public.exercises e
    where e.id = 'c9efa90c-6348-4cdc-b471-ac78acaa2ce5'
      and e.source = 'musclewiki' and e.source_id = 162394506795845
      and public.exercise_content_hash(e.name, e.description, e.steps)
        = 'ab22980df172bd30129a4a19f32231d817b2309eeb171a19d0cacff3f24a293c'
  ) then raise exception 'Source revision changed; refresh the reviewed translation'; end if;
  if exists (
    select 1 from public.exercise_translations c
    where c.exercise_id = 'c9efa90c-6348-4cdc-b471-ac78acaa2ce5' and c.locale = 'vi'
      and (c.source_hash is distinct from 'ab22980df172bd30129a4a19f32231d817b2309eeb171a19d0cacff3f24a293c'
        or c.source_locale is distinct from 'en' or c.name is distinct from 'Tư thế cầu nguyện ngược'
        or c.description is distinct from ''
        or c.steps is distinct from jsonb_build_array(
          'Bắt đầu ở tư thế ngồi hoặc đứng, hai tay thả dọc theo thân người.',
          'Đưa hai tay ra sau lưng, đan các ngón tay vào nhau và hướng lòng bàn tay lên trên.',
          'Hít vào, kéo hai bả vai lại gần nhau và nâng ngực lên.',
          'Thở ra, nhẹ nhàng ấn hai tay xuống sàn đồng thời tiếp tục nâng ngực.'
        )
        or c.translation_status is distinct from 'reviewed'
        or c.reviewed_at is distinct from '2026-10-23T11:45:08.117Z'::timestamptz)
  ) then raise exception 'Existing translation differs; refresh instead of overwriting'; end if;
end;
$verify_source$;

insert into public.exercise_translations (
  exercise_id, locale, source_locale, source_hash, name, description,
  steps, translation_status, reviewed_at
)
values (
  'c9efa90c-6348-4cdc-b471-ac78acaa2ce5', 'vi', 'en',
  'ab22980df172bd30129a4a19f32231d817b2309eeb171a19d0cacff3f24a293c',
  'Tư thế cầu nguyện ngược', '',
  jsonb_build_array(
    'Bắt đầu ở tư thế ngồi hoặc đứng, hai tay thả dọc theo thân người.',
    'Đưa hai tay ra sau lưng, đan các ngón tay vào nhau và hướng lòng bàn tay lên trên.',
    'Hít vào, kéo hai bả vai lại gần nhau và nâng ngực lên.',
    'Thở ra, nhẹ nhàng ấn hai tay xuống sàn đồng thời tiếp tục nâng ngực.'
  ),
  'reviewed', '2026-10-23T11:45:08.117Z'::timestamptz
)
on conflict (exercise_id, locale) do nothing;

do $verify_translation$
begin
  if (select count(*) from public.exercise_translations c
    where c.exercise_id = 'c9efa90c-6348-4cdc-b471-ac78acaa2ce5' and c.locale = 'vi'
      and c.source_hash = 'ab22980df172bd30129a4a19f32231d817b2309eeb171a19d0cacff3f24a293c'
      and c.source_locale = 'en' and c.name = 'Tư thế cầu nguyện ngược'
      and c.description = '' and c.steps = jsonb_build_array(
        'Bắt đầu ở tư thế ngồi hoặc đứng, hai tay thả dọc theo thân người.',
        'Đưa hai tay ra sau lưng, đan các ngón tay vào nhau và hướng lòng bàn tay lên trên.',
        'Hít vào, kéo hai bả vai lại gần nhau và nâng ngực lên.',
        'Thở ra, nhẹ nhàng ấn hai tay xuống sàn đồng thời tiếp tục nâng ngực.'
      ) and c.translation_status = 'reviewed'
      and c.reviewed_at = '2026-10-23T11:45:08.117Z'::timestamptz) <> 1 then
    raise exception 'Translation insert verification failed; transaction rolled back';
  end if;
end;
$verify_translation$;
commit;

-- Expected total after this insert: 1,928 reviewed (1,927 Vietnamese; 1 English).
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
