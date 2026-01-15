import {
  Route,
  Routes,
} from "react-router-dom";
import FactsTable from "./FactsTable.tsx";
import GenerateText from "./GenerateText.tsx";
import Navbar from "./Navbar.tsx";
import WritingStyle from "./WritingStyle.tsx";
import Test from "./Test.tsx";

function App() {

    return (
        <div className="min-h-screen flex flex-col bg-zinc-900">
            <Navbar />

            <main className="flex-1 h-full w-full flex flex-col justify-center">
                <Routes>
                    <Route path="/" element={<GenerateText/>} />
                    <Route path="facts" element={<FactsTable/>} />
                    <Route path="style" element={<WritingStyle/>} />
                    <Route path="test" element={<Test/>} />
                </Routes>
            </main>

        </div>
    );

}

export default App;