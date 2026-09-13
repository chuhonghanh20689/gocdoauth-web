import { createClient } from '@supabase/supabase-js';
import readline from 'node:readline';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

try {
  const email = (await ask('Email Owner: ')).trim();
  const password = await ask('Mật khẩu mới (>=10 ký tự): ');
  const confirm = await ask('Nhập lại mật khẩu: ');
  rl.close();

  if (!email || password.length < 10) throw new Error('Email không được trống và mật khẩu phải có ít nhất 10 ký tự.');
  if (password !== confirm) throw new Error('Hai mật khẩu không khớp.');

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: users, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const user = users.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('Không tìm thấy user Auth với email này.');

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (updateError) throw updateError;

  const { error: profileError } = await supabase
    .from('admin_profiles')
    .upsert({ id: user.id, email: user.email, name: 'Owner', role: 'owner', is_active: true }, { onConflict: 'id' });
  if (profileError) throw profileError;

  console.log('Đã đặt lại mật khẩu Owner thành công.');
  console.log('Bạn có thể đăng nhập tại: http://localhost:3000/admin/login');
} catch (err) {
  rl.close();
  console.error('Không thể đặt mật khẩu:', err?.message || err);
  process.exit(1);
}
