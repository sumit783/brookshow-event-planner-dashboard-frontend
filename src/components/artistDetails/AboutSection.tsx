interface AboutSectionProps {
  bio: string;
}

export function AboutSection({ bio }: AboutSectionProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
        About
      </h2>
      <p className="text-muted-foreground leading-relaxed">
        {bio}
      </p>
    </div>
  );
}
