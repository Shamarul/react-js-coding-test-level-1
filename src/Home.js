import "./App.css";
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

function Home() {

  const [state, setState] = useState({
    name: ""
  })
  const [isReady, setIsReady] = useState(false);

  function handleChange(evt) {
    const value = evt.target.value;
    setState({
      ...state,
      [evt.target.name]: value
    });

    if(evt.target.name === 'name' && value.toLowerCase() === 'ready!') {
      setIsReady(true);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <NavLink to="/pokedex" hidden={!isReady} >
          <img
            src="https://www.freeiconspng.com/uploads/file-pokeball-png-0.png"
            className="App-logo"
            alt="logo"
            style={{ padding: "10px" }}
          />
        </NavLink>
        <b>
          Requirement: Try to show the hidden image and make it clickable that
          goes to /pokedex when the input below is "Ready!" remember to hide the
          red text away when "Ready!" is in the textbox.
        </b>
        <p>Are you ready to be a pokemon master?</p>
        <input type="text" name="name" onChange={handleChange}/>
        {!isReady &&
          <span style={{ color: "red" }}>I am not ready yet!</span>
        }
      </header>
    </div>
  );
}

export default Home;
