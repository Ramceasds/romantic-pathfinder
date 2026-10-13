import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  LogOut,
  Sparkles,
  Eye,
  Plus,
  X,
  Sliders,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { AmbientBackground } from "@/components/AmbientBackground";
import { ProfilePreviewDialog } from "@/components/ProfilePreviewDialog";
import { AvatarPickerModal } from "@/components/AvatarPickerModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useMyProfile } from "@/hooks/use-auth";
import {
  GENDERS,
  INTERESTED_IN,
  POPULAR_INTEREST_CATEGORIES,
  BIO_PROMPTS,
  calculateProfileStrength,
  type Profile,
} from "@/lib/profile";
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
            "flex-1 rounded-full border px-3 py-2.5 text-xs font-semibold transition-all duration-200 active:scale-95",
            value === o.value
              ? "border-primary bg-gradient-romantic text-white shadow-glow"
              : "border-border/60 bg-card/80 text-foreground hover:bg-card",
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
  const [interestsList, setInterestsList] = useState<string[]>(profile?.interests ?? []);
  const [customInterest, setCustomInterest] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(profile?.photo_url ?? null);
  const [ageRange, setAgeRange] = useState<number[]>([
    profile?.min_age ?? 18,
    profile?.max_age ?? 80,
  ]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dialog States
  const [previewOpen, setPreviewOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Profile strength calculation
  const strength = calculateProfileStrength({
    photo_url: photoPath,
    display_name: name,
    age: age,
    bio: bio,
    city: city,
    interests: interestsList,
  });

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

  function toggleInterest(tag: string) {
    if (interestsList.includes(tag)) {
      setInterestsList(interestsList.filter((t) => t !== tag));
    } else {
      if (interestsList.length >= 8) {
        toast.error("Maximum 8 interests allowed");
        return;
      }
      setInterestsList([...interestsList, tag]);
    }
  }

  function addCustomInterest() {
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    if (interestsList.includes(trimmed)) {
      toast.error("Interest already added");
      return;
    }
    if (interestsList.length >= 8) {
      toast.error("Maximum 8 interests allowed");
      return;
    }
    setInterestsList([...interestsList, trimmed]);
    setCustomInterest("");
  }

  function insertPrompt(prompt: string) {
    if (bio.includes(prompt)) return;
    const separator = bio.trim().length > 0 ? "\n\n" : "";
    setBio((prev) => `${prev}${separator}${prompt} `);
    toast.success("Prompt added to your bio");
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
      interests: interestsList,
      photo_url: photoPath,
      min_age: ageRange[0] ?? 18,
      max_age: ageRange[1] ?? 80,
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
    <div className="relative min-h-full overflow-hidden pb-12">
      <AmbientBackground intensity="subtle" />

      <form onSubmit={save} className="space-y-6 px-5 pt-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              {isNew ? "Create profile" : "Your profile"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize how matches discover and connect with you
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            className="rounded-full border-primary/30 bg-card/80 text-xs font-semibold text-primary shadow-soft backdrop-blur-md hover:bg-primary/10"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview card
          </Button>
        </header>

        {/* Profile Strength Card */}
        <section className="rounded-3xl border border-white/60 bg-card/75 p-4 shadow-soft backdrop-blur-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Profile Strength
            </span>
            <span className="text-xs font-bold text-primary">
              {strength.percentage}% Complete
            </span>
          </div>

          <Progress value={strength.percentage} className="h-2 bg-primary/15" />

          {strength.tips.length > 0 ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-none" />
              <span>Next tip: {strength.tips[0]}</span>
            </p>
          ) : (
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 pt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 flex-none" />
              Your profile is optimized for maximum matches!
            </p>
          )}
        </section>

        {/* Photo Uploader with Gallery Modal Trigger */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="rounded-[2.25rem] p-1.5 bg-gradient-to-tr from-rose-500/80 via-primary to-amber-400/80 shadow-glow transition-transform hover:scale-[1.02]">
            <button
              type="button"
              onClick={() => setAvatarPickerOpen(true)}
              className="group relative h-48 w-40 overflow-hidden rounded-[2rem] bg-card"
              aria-label="Change photo"
            >
              <ProfilePhoto
                path={photoPath}
                name={name || "?"}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-photo-fade py-3.5 text-xs font-semibold text-white backdrop-blur-sm">
                <Camera className="h-4 w-4" />
                {uploading ? "Uploading…" : photoPath ? "Change photo" : "Add photo"}
              </span>
            </button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAvatarPickerOpen(true)}
            className="text-xs font-medium text-primary hover:text-primary/80"
          >
            Choose from gallery or device
          </Button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => onPickPhoto(e.target.files?.[0])}
          />
        </div>

        {/* Basic Details */}
        <section className="space-y-4 rounded-3xl border border-white/60 bg-card/75 p-5 shadow-soft backdrop-blur-xl">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Display Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="Your name"
                className="h-12 rounded-2xl border-border/60 bg-background/80"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Age
              </Label>
              <Input
                id="age"
                type="number"
                inputMode="numeric"
                min={18}
                max={99}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="h-12 rounded-2xl border-border/60 bg-background/80"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              City / Location
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={60}
              placeholder="e.g. San Francisco, CA"
              className="h-12 rounded-2xl border-border/60 bg-background/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              I am
            </Label>
            <Choice options={GENDERS} value={gender as "woman"} onChange={setGender} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Looking for
            </Label>
            <Choice options={INTERESTED_IN} value={interestedIn as "everyone"} onChange={setInterestedIn} />
          </div>
        </section>

        {/* Bio & Spark Prompts */}
        <section className="space-y-3 rounded-3xl border border-white/60 bg-card/75 p-5 shadow-soft backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              About me
            </Label>
            <span className="text-xs text-muted-foreground">
              {bio.length} / 300
            </span>
          </div>

          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            rows={4}
            className="rounded-2xl border-border/60 bg-background/80 leading-relaxed"
            placeholder="Tell your story, share what brings you joy, or tap a prompt below..."
          />

          {/* Icebreaker Prompts Chips */}
          <div className="pt-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Need inspiration? Tap a prompt:
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {BIO_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => insertPrompt(prompt)}
                  className="flex-none rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Visual Interest Tags */}
        <section className="space-y-3.5 rounded-3xl border border-white/60 bg-card/75 p-5 shadow-soft backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Interests
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select your favorite vibes & hobbies
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-bold",
                interestsList.length >= 3
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-amber-500/10 text-amber-600",
              )}
            >
              {interestsList.length} / 8 selected
            </span>
          </div>

          {/* Currently Selected Tags */}
          {interestsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {interestsList.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-gradient-romantic text-white px-3 py-1 text-xs font-semibold shadow-soft"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    aria-label={`Remove ${tag}`}
                    className="hover:opacity-75"
                  >
                    <X className="h-3 w-3 stroke-[3]" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Custom Tag Input */}
          <div className="flex gap-2 pt-1">
            <Input
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomInterest();
                }
              }}
              maxLength={25}
              placeholder="Add custom interest..."
              className="h-10 rounded-xl border-border/60 bg-background/80 text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomInterest}
              className="h-10 rounded-xl border-border/60 bg-card px-3 text-xs font-semibold"
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add
            </Button>
          </div>

          {/* Categorized Popular Interests */}
          <div className="space-y-3 pt-2">
            {POPULAR_INTEREST_CATEGORIES.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {cat.category}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((item) => {
                    const isSelected = interestsList.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleInterest(item)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 active:scale-95",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border/60 bg-background/60 text-foreground hover:border-primary/40 hover:bg-card",
                        )}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Discovery Match Preferences */}
        <section className="space-y-3 rounded-3xl border border-white/60 bg-card/75 p-5 shadow-soft backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-primary" />
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Discovery Age Range
              </Label>
            </div>
            <span className="text-xs font-bold text-foreground">
              {ageRange[0]} – {ageRange[1]} years
            </span>
          </div>

          <div className="pt-2">
            <Slider
              min={18}
              max={80}
              step={1}
              minStepsBetweenThumbs={1}
              value={ageRange}
              onValueChange={setAgeRange}
            />
          </div>
        </section>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={saving || uploading}
            className="h-14 w-full rounded-full bg-gradient-romantic text-base font-semibold text-white shadow-glow-strong transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : isNew ? "Start matching" : "Save changes"}
          </Button>

          {!isNew && (
            <Button
              type="button"
              variant="ghost"
              onClick={signOut}
              className="w-full rounded-full border border-border/40 text-muted-foreground hover:bg-card hover:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          )}
        </div>
      </form>

      {/* Profile Live Card Preview Modal */}
      <ProfilePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        previewProfile={{
          id: profile?.id,
          display_name: name,
          age: Number(age) || 24,
          city,
          bio,
          interests: interestsList,
          photo_url: photoPath,
        }}
      />

      {/* Avatar Gallery / Custom Upload Modal */}
      <AvatarPickerModal
        open={avatarPickerOpen}
        onOpenChange={setAvatarPickerOpen}
        currentPhoto={photoPath}
        onSelectPhoto={(path) => setPhotoPath(path)}
        onTriggerFileUpload={() => fileRef.current?.click()}
      />
    </div>
  );
}
