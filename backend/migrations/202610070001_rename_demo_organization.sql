UPDATE organizations
SET display_name = 'Desert Bloom Landscaping',
    updated_at = NOW()
WHERE id = 'org_demo_landscaping'
  AND display_name = 'Grover Demo Landscaping';
