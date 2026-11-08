-- Matching weights (proposal 6.6): score = w1*proximity + w2*category + w3*availability + w4*capacity + w5*service_area
-- Weights should sum to 1. These are starting values to be tuned during implementation.
INSERT INTO system_settings (key, value, description) VALUES
    ('matching.weights',
     '{"proximity":0.30,"category":0.25,"availability":0.15,"capacity":0.15,"service_area":0.15}',
     'Weights used by backend/src/algorithms/matching/scoring.ts'),
    ('matching.max_candidates',        '10',  'Max collectors shortlisted per pickup request'),
    ('matching.max_search_radius_km',  '25',  'Collectors farther than this are never shortlisted'),
    ('pickup.request_expiry_hours',    '48',  'Unaccepted pickup requests expire after this many hours')
ON CONFLICT (key) DO NOTHING;
