-- Run after the migration. All test records are rolled back.
begin;

do $$
declare
  test_id constant uuid := 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee';
  before_update timestamptz;
  current_status text;
begin
  assert public.exercise_content_hash('Barbell Bench Press', '', '["Lie on the bench.","Press the bar upward."]')
    = 'd02093719bb96573a5332fc11b0d1a5ae580f3165fdf07167f12c8f703088c3e', 'JavaScript/PostgreSQL source hashes differ';
  assert public.valid_exercise_translation_steps('["A valid instruction"]');
  assert not public.valid_exercise_translation_steps('[42]');
  assert not public.valid_exercise_translation_steps('[" "]');

  insert into public.exercises (id, name, slug, status, steps)
  values (test_id, 'Barbell Bench Press', 'localization-transaction-test-eeeeeeee', 'Published', '["Lie on the bench.","Press the bar upward."]');
  select updated_at into before_update from public.exercises where id = test_id;
  insert into public.exercise_translations (exercise_id,locale,name,steps,source_locale,source_hash,translation_status,reviewed_at)
  values (test_id,'vi','Test translation','["Translated one","Translated two"]','en',
    'd02093719bb96573a5332fc11b0d1a5ae580f3165fdf07167f12c8f703088c3e','reviewed',now());
  assert (select updated_at = before_update from public.exercises where id = test_id), 'Translation changed exercise rank timestamp';

  update public.exercises set media = '[]' where id = test_id;
  select translation_status into current_status from public.exercise_translations where exercise_id = test_id;
  assert current_status = 'reviewed', 'Media-only edit expired the translation';

  update public.exercises set name = 'Updated press' where id = test_id;
  select translation_status into current_status from public.exercise_translations where exercise_id = test_id;
  assert current_status = 'stale', 'Source edit did not expire the translation';
  assert (select reviewed_at is null from public.exercise_translations where exercise_id = test_id);

  begin
    update public.exercise_translations set translation_status = 'reviewed', reviewed_at = now() where exercise_id = test_id;
    raise exception 'Outdated source hash was accepted';
  exception when check_violation then null;
  end;

  update public.exercise_translations set translation_status = 'draft',
    source_hash = public.exercise_content_hash('Updated press','','["Lie on the bench.","Press the bar upward."]')
  where exercise_id = test_id;
end;
$$;

set local role anon;
do $$
begin
  assert (select count(*) = 0 from public.exercise_translations where exercise_id = 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee'), 'Anonymous users can read drafts';
  begin
    update public.exercise_translations set name = 'Unauthorized' where exercise_id = 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee';
    raise exception 'Anonymous translation writes were allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

update public.exercise_translations set translation_status = 'reviewed', reviewed_at = now()
where exercise_id = 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee';

set local role anon;
do $$
begin
  assert (select count(*) = 1 from public.exercise_translations where exercise_id = 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee'), 'Anonymous users cannot read current reviewed translations';
end;
$$;
reset role;

update public.exercises set status = 'Draft' where id = 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee';
set local role anon;
do $$
begin
  assert (select count(*) = 0 from public.exercise_translations where exercise_id = 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee'), 'Unpublished exercise translation was exposed';
end;
$$;
reset role;
rollback;

select 'PASS: hash parity, stale content, timestamp preservation and anonymous RLS; test data rolled back' as result;
