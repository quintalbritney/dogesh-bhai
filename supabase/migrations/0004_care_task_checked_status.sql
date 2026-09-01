-- Additive enum value for the "checked in, no feeding needed" volunteer
-- action -- distinct from 'completed' (fed) and 'missed'. Kept in its own
-- file/transaction: a newly added enum value cannot be referenced in the
-- same transaction that adds it on some Postgres versions.
alter type care_task_status add value 'checked_no_action_needed';
