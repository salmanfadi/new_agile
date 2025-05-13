console.log(`
To create a test user, please follow these steps:

1. Go to the Supabase Dashboard: https://app.supabase.com/project/kysvcexqmywyrawakwfs
2. Navigate to 'Authentication' > 'Users'
3. Click 'Add User'
4. Fill in the following details:
   - Email: test.manager@example.com
   - Password: Test@1234
   - User Metadata (JSON):
     {
       "username": "testmanager",
       "name": "Test Manager",
       "role": "warehouse_manager"
     }
5. Click 'Create User'

6. After creating the user, go to 'Table Editor' and find the 'profiles' table
7. Manually add a row with these values:
   - id: (the user's UUID from the auth.users table)
   - username: testmanager
   - name: Test Manager
   - role: warehouse_manager
   - active: true
   - created_at: (current timestamp)
   - updated_at: (current timestamp)

After completing these steps, you should be able to log in with:
- Email: test.manager@example.com
- Password: Test@1234
`);
