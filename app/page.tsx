import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect vers l'annonce par défaut
  redirect('/annonce/raismes-t3');
}
