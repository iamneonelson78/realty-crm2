import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://dhfjmbqljsqkgixbkgkd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZmptYnFsanNxa2dpeGJrZ2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NDIwODksImV4cCI6MjA5MjMxODA4OX0.TdyiZOmtiO68i8IwcPMwUQ4FG6QTVj8HFuoI8mVoQ5U');

async function setup() {
  const { error } = await supabase.auth.signUp({
    email: 'agent@realty.com',
    password: 'password123',
    options: { data: { full_name: 'Pro Agent', role: 'agent' } }
  });
  console.log('Signup agent result:', error ? error.message : 'Success');

  const { error: adminErr } = await supabase.auth.signUp({
    email: 'admin@realty.com',
    password: 'password123',
    options: { data: { full_name: 'Admin Manager', role: 'admin' } }
  });
  console.log('Signup admin result:', adminErr ? adminErr.message : 'Success');
}

setup();
