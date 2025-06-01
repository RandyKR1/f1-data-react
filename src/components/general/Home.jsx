import React from "react";
import { Link } from "react-router-dom";
import Search from "./Search";

const Home = () => {
    return(
        <div>
            <h1>Welcome! Looking for all things F1 data?</h1>
            <h2>You're in the right place</h2>
            <br/>
            <h4>Start your search below:</h4>

            <Search />

        </div>
    )
}

export default Home;