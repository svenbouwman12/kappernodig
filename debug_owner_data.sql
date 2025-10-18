-- Debug script to check owner data
SELECT 
    b.id as barber_id,
    b.naam as barber_naam,
    b.owner_id,
    p.id as profile_id,
    p.naam as profile_naam,
    p.role as profile_role,
    p.email as profile_email
FROM barbers b
LEFT JOIN profiles p ON b.owner_id = p.id
WHERE b.owner_id IS NOT NULL
ORDER BY b.naam;
