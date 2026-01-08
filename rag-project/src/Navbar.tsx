import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="p-4 bg-zinc-900 flex gap-4 text-zinc-200">
      <Link to="/">Generate Text</Link>
      <Link to="/facts">Edit Database</Link>
      <Link to="/style">Writing style</Link>
    </nav>
  );
}

export default Navbar;