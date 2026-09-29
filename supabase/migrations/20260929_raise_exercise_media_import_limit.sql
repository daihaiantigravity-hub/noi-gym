-- Preserve the admin form's 25 MB limit while allowing unmodified source clips
-- up to 32 MB in the female MuscleWiki migration.
update storage.buckets
set file_size_limit = 33554432
where id = 'exercise-media'
  and (file_size_limit is null or file_size_limit < 33554432);
