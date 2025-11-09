"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Shield } from "lucide-react";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

const AdminSettingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyTitle>System Settings</EmptyTitle>
            <EmptyDescription>
              System settings configuration coming soon
            </EmptyDescription>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;

