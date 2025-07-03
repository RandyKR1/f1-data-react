import { motion } from "motion/react";
import Search from "./Search";

const Home = () => {
    return (
        <div className="
            d-flex flex-column 
            align-items-center justify-content-center 
            text-center 
            container-fluid 
            vh-100 vw-100
            px-3 py-4"
        >
            <motion.h1
                className="display-3 d-none d-md-block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 3 }}
            >
                Welcome!
            </motion.h1>

            <motion.h1
                className="display-4 d-block d-md-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 3 }}
            >
                Welcome!
            </motion.h1>

            <motion.h2
                className="mt-2 fs-3 fs-md-2"
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 3 }}
            >
                Looking for all things F1?
            </motion.h2>

            <br />
            <motion.h4
                className="mt-2 fs-6 fs-md-5"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 3 }}
            >
                Start your search below:
            </motion.h4>

            <div
                className="container-fluid mt-4"
                style={{
                    minHeight: "250px",
                    transition: "min-height 0.3s ease"
                }}>
                <Search />
            </div>

        </div>
    );
};

export default Home;
