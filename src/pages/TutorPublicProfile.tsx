import { useParams } from "react-router-dom";

export default function TutorPublicProfile() {
  const { id } = useParams();

  return (
    <div className="container py-12 max-w-2xl animate-fade-in">
      <div className="rounded-xl border bg-card p-8 shadow-card text-center">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-2xl gradient-navy text-3xl font-bold text-primary-foreground mb-4">
          T
        </div>
        <h1 className="text-2xl font-bold text-foreground">Tutor Profile</h1>
        <p className="text-sm text-muted-foreground mt-2">Profile data will load from the database once connected.</p>
        <p className="text-xs text-muted-foreground mt-4">Profile ID: {id}</p>
      </div>
    </div>
  );
}
