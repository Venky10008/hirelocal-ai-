const SKILL_SLUG_MAP: Record<string, string> = {
  electrician: "electrician",
  plumber: "plumber",
  carpenter: "carpenter",
  painter: "painter",
  "ac repair": "ac-repair",
  cleaning: "cleaning",
};

export function categoryToSkillSlug(category: string): string {
  const key = category.trim().toLowerCase();
  if (SKILL_SLUG_MAP[key]) return SKILL_SLUG_MAP[key]!;
  if (key.includes("ac")) return "ac-repair";
  return key.replace(/\s+/g, "-");
}

export function skillSlugToCategory(slug: string): string {
  const map: Record<string, string> = {
    electrician: "Electrician",
    plumber: "Plumber",
    carpenter: "Carpenter",
    painter: "Painter",
    "ac-repair": "AC Repair",
    cleaning: "Cleaning",
  };
  return map[slug] ?? slug;
}
