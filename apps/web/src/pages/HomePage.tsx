import ThemeSwitch from '#styles/containers/ThemeSwitch';

export default function HomePage() {
  return (
    <>
      <h1>{"You're on the Home page"}</h1>
      <ThemeSwitch />
      <h2 className="text-primary">Primary</h2>
      <h2 className="text-primary-light">Primary Light</h2>
      <h2 className="text-primary-dark">Primary Dark</h2>
      <div className="text-text-onPrimary bg-primary">Primary Text</div>
      <h2 className="text-secondary">Secondary</h2>
      <h2 className="text-secondary-light">Secondary Light</h2>
      <h2 className="text-secondary-dark">Secondary Dark</h2>
      <div className="text-text-onSecondary bg-secondary">Secondary Text</div>
      <h2 className="text-success">Success</h2>
      <h2 className="text-success-light shadow-4">Success Light</h2>
      <h2 className="text-success-dark">Success Dark</h2>
      <div className="text-text-onSuccess bg-success">Success Text</div>
    </>
  );
}
