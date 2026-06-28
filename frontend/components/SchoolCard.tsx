import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SchoolOut } from "@/lib/api";

export default function SchoolCard({ school }: { school: SchoolOut }) {
  return (
    <Link href={`/schools/${school.school_id}`} className="group">
      <Card className="h-full transition group-hover:border-brand/40 group-hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base text-brand-dark">
              {school.name}
            </CardTitle>
            <div className="flex shrink-0 gap-1">
              {school.is_985 && (
                <Badge className="bg-brand/15 text-brand-dark">985</Badge>
              )}
              {school.is_211 && (
                <Badge className="bg-brand/15 text-brand-dark">211</Badge>
              )}
            </div>
          </div>
          <CardDescription>
            {[school.city, school.type, school.nature, school.level]
              .filter(Boolean)
              .join(" · ")}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
