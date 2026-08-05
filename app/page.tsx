import { redirect } from 'next/navigation';

export default function Home() {
  // Sistem akan terus bawa pengguna ke paparan login baharu (app/login/page.tsx)
  redirect('/login');
}