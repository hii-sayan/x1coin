// frontend/src/App.tsx
import StakingApp from './components/StakingApp'
import TokenManagement from './components/TokenManagement'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <TokenManagement />
        <StakingApp />
      </div>
    </div>
  )
}

export default App