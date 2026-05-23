SELECT setval('public.members_id_seq', COALESCE((SELECT MAX(id) FROM public.members), 1), true);
SELECT setval('public.classes_id_seq', COALESCE((SELECT MAX(id) FROM public.classes), 1), true);
SELECT setval('public.payments_id_seq', COALESCE((SELECT MAX(id) FROM public.payments), 1), true);
SELECT setval('public.trainers_id_seq', COALESCE((SELECT MAX(id) FROM public.trainers), 1), true);
SELECT setval('public.membership_types_id_seq', COALESCE((SELECT MAX(id) FROM public.membership_types), 1), true);
SELECT setval('public.membership_requests_id_seq', COALESCE((SELECT MAX(id) FROM public.membership_requests), 1), true);