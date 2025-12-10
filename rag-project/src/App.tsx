import {
  Route,
  Routes,
} from "react-router-dom";
import FactsTable from "./FactsTable.tsx";
import GenerateText from "./GenerateText.tsx";
import Navbar from "./Navbar.tsx";
import WritingStyle from "./WritingStyle.tsx";

function App() {

    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<GenerateText/>} />
                <Route path="facts" element={<FactsTable/>} />
                <Route path="style" element={<WritingStyle/>} />
            </Routes>
        </>
    );

}

export default App;