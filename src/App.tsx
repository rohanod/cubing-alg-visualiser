import "./App.css";
import { Button } from "./vendor/apps-sdk-ui/components/Button";
import { EmptyMessage } from "./vendor/apps-sdk-ui/components/EmptyMessage";
import { Archive } from "./vendor/apps-sdk-ui/components/Icon";

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-text">
          <h1>Cubing Alg Visualiser</h1>
          <p className="app-tagline">Browse algorithm sets and track case angles.</p>
        </div>
      </header>
      <main className="app-main">
        <EmptyMessage>
          <EmptyMessage.Icon color="secondary">
            <Archive />
          </EmptyMessage.Icon>
          <EmptyMessage.Title>No algorithm set loaded</EmptyMessage.Title>
          <EmptyMessage.Description>
            Load an algorithm set to get started. Import will land in a follow-up.
          </EmptyMessage.Description>
          <EmptyMessage.ActionRow>
            <Button color="primary" variant="soft" size="lg" disabled>
              Import set
            </Button>
          </EmptyMessage.ActionRow>
        </EmptyMessage>
      </main>
    </div>
  );
}
