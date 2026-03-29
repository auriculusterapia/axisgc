-- Update Ivan Sousa to PROFESSIONAL role and permissions
UPDATE public.profiles 
SET 
  role = 'PROFESSIONAL',
  permissions = ARRAY[
    'dashboard', 'dashboard:view', 
    'patients', 'patients:view', 'patients:create', 'patients:edit',
    'evaluations', 'evaluations:view', 'evaluations:create', 'evaluations:edit',
    'calendar', 'calendar:view', 'calendar:create', 'calendar:edit',
    'auricular', 'auricular:view', 'auricular:edit',
    'protocols', 'protocols:view', 'protocols:create', 'protocols:edit',
    'settings', 'settings:profile'
  ]
WHERE name ILIKE '%Ivan Sousa%';
