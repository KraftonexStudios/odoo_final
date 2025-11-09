"use client";

import { useCurrentUser, useUpdateProfile, useUploadProfileImage } from "@/hooks/profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Upload, Save } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { base64ToDataUrl, cn, getAvatarGradient, getInitials } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { data, isLoading } = useCurrentUser();
  const { mutate: updateProfile, isPending: updating } = useUpdateProfile();
  const { mutate: uploadImage, isPending: uploading } = useUploadProfileImage();

  const user = data?.data;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setAvatarSrc(base64ToDataUrl(user.avatar));
    }
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarSrc(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append("avatar", file);
      uploadImage(formData);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      firstName,
      lastName,
    });
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const displayAvatarSrc = avatarSrc || base64ToDataUrl(user?.avatar);
  const initials = getInitials(user?.firstName, user?.lastName);
  const gradient = getAvatarGradient(user?.firstName || user?.email || "User");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <User className="h-8 w-8" />
          My Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information and profile picture
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Picture Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Upload your profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              {displayAvatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayAvatarSrc} alt="Profile" className="object-cover" />
              ) : (
                <AvatarFallback className={cn(gradient, "text-white font-bold text-3xl")}>
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Change Picture"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Recommended: Square image, at least 256x256px
            </p>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={user?.role?.replace(/_/g, " ") || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Contact admin to change your role
                </p>
              </div>

              {user?.hourlyRate && user.hourlyRate > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate</Label>
                  <Input
                    id="hourlyRate"
                    value={`$${user.hourlyRate}/hour`}
                    disabled
                    className="bg-muted font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact admin to update your hourly rate
                  </p>
                </div>
              )}

              <Separator />

              <div className="flex justify-end">
                <Button type="submit" disabled={updating} className="gap-2">
                  <Save className="h-4 w-4" />
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

