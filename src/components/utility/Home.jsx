import { motion } from "motion/react";
import Search from "./Search";

const Home = () => {
    return (
        <div className="
            d-flex flex-column 
            align-items-center justify-content-center 
            text-center 
            container-fluid 
            vh-100 vw-100"
        >
            <motion.h1
                style={{ fontSize: "80px" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 3 }}
            >
                Welcome!
            </motion.h1>

            <motion.h2
                style={{ fontSize: "50px" }}
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 3 }}
            >
                Looking for all things F1 data?
            </motion.h2>

            <br />
            <motion.h4
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 3 }}
            >
                Start your search below:
            </motion.h4>

                <Search />

        </div>
    );
};

export default Home;
