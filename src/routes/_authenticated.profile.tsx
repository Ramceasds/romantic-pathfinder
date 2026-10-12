import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useMyProfile } from "@/hooks/use-auth";
import { GENDERS, INTERESTED_IN, parseInterests } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Ember" },
      { name: "description", content: "Edit your photo, bio and interests on Ember." },
      { property: "og:title", content: "Your profile — Ember" },
      { property: "og:description", content: "Edit your photo, bio and interests on Ember." },
    ],
  }),
  component: ProfilePage,
});

function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-full border px-3 py-2.5 text-sm font-medium transition-colors",
            value === o.value
              ? "border-primary bg-primary text-primary-foreground shadow-glow"
              : "bg-card text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useMyProfile(user?.id);
  const isNew = !profile;

  const [name, setName] = useState(profile?.display_name ?? "");
  const [age, setAge] = useState(profile ? String(profile.age) : "");
  const [gender, setGender] = useState(profile?.gender ?? "woman");
  const [interestedIn, setInterestedIn] = useState(profile?.interested_in ?? "everyone");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [interests, setInterests] = useState((profile?.interests ?? []).join(", "));
  const [photoPath, setPhotoPath] = useState<string | null>(profile?.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickPhoto(file: File | undefined) {
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) {
      toast.error("Photo upload failed");
      return;
    }
    setPhotoPath(path);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const ageNum = Number(age);
    if (!name.trim()) {
      toast.error("Please add your name");
      return;
    }
    if (!Number.isInteger(ageNum) || ageNum < 18 || ageNum > 99) {
      toast.error("You must be 18 or older to join");
      return;
    }
    setSaving(true);
    const payload = {
      display_name: name.trim(),
      age: ageNum,
      gender,
      interested_in: interestedIn,
      bio: bio.trim(),
      city: city.trim(),
      interests: parseInterests(interests),
      photo_url: photoPath,
    };
    const { error } = profile
      ? await supabase.from("profiles").update(payload).eq("id", profile.id)
      : await supabase.from("profiles").insert({ ...payload, user_id: user.id });
    setSaving(false);
    if (error) {
      toast.error("Could not save your profile");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["my-profile"] });
    toast.success(isNew ? "Welcome to Ember!" : "Profile saved");
    if (isNew) navigate({ to: "/discover" });
  }

  async function signOut() {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/" });
  }

  return (
    <form onSubmit={save} className="space-y-6 px-5 pb-10 pt-8">
      <header>
        <h1 className="text-3xl font-semibold">{isNew ? "Create your profile" : "Your profile"}</h1>
        {isNew && (
          <p className="mt-1 text-sm text-muted-foreground">A few details so people can get to know you.</p>
        )}
      </header>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative h-44 w-36 overflow-hidden rounded-3xl bg-secondary shadow-card"
          aria-label="Change photo"
        >
          <ProfilePhoto path={photoPath} name={name || "?"} className="h-full w-full" />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-photo-fade py-3 text-xs font-medium text-primary-foreground">
            <Camera className="h-4 w-4" /> {uploading ? "Uploading…" : photoPath ? "Change" : "Add photo"}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => onPickPhoto(e.target.files?.[0])}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="h-12 rounded-2xl bg-card" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input id="age" type="number" inputMode="numeric" min={18} max={99} value={age} onChange={(e) => setAge(e.target.value)} className="h-12 rounded-2xl bg-card" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>I am</Label>
        <Choice options={GENDERS} value={gender as "woman"} onChange={setGender} />
      </div>
      <div className="space-y-2">
        <Label>Show me</Label>
        <Choice options={INTERESTED_IN} value={interestedIn as "everyone"} onChange={setInterestedIn} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} className="h-12 rounded-2xl bg-card" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">About me</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={4} className="rounded-2xl bg-card" placeholder="What makes you smile?" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="interests">Interests</Label>
        <Input id="interests" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Hiking, coffee, films" className="h-12 rounded-2xl bg-card" />
        <p className="text-xs text-muted-foreground">Separate with commas (up to 8).</p>
      </div>

      <Button type="submit" size="lg" disabled={saving || uploading} className="h-14 w-full rounded-full bg-gradient-primary text-base shadow-glow">
        {saving ? "Saving…" : isNew ? "Start matching" : "Save changes"}
      </Button>

      {!isNew && (
        <Button type="button" variant="ghost" onClick={signOut} className="w-full text-muted-foreground">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      )}
    </form>
  );
}
