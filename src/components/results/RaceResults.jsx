


const RaceResults = () => {

    return (
        <div>
            <div className="container vw-100">
                {/* Header */}
                <div className="row mt-5 mb-4 p-0 d-flex">
                    {/* <h3 className="col-sm-12 col-md-6 text-center text">{meetingInfo.meeting_official_name}</h3>
                    <h3 className="col-md-6 text-center">Free {sessionInfo.session_name} Results</h3> */}
                    <h3 className="col-sm-12 col-md-6 text-center text">Name</h3>
                    <h3 className="col-md-6 text-center">Free Results</h3>
                </div>

                {/* Search */}
                <div className="row">
                    {/* Search Component */}
                    {/* <Search /> */}
                    <p>Search</p>
                </div>

                {/* Fastest Lap Table */}
                <div className="row mt-4">
                    <div className="col-12">
                        {/* FastestLapsTable Component */}
                        {/* <FastestLapsTable /> */}
                        <p>Lap table</p>
                    </div>
                </div>

                {/* Lap Time Chart */}
                <div className="row mt-4">
                    <div className="col-12">
                        {/* LapTimeChart Component */}
                        {/* <LapTimeChart /> */}
                        <p>Lap Chart</p>
                    </div>
                </div>

                {/* Weather, Longest Stint Per Compound, Race Control */}
                <div className="row my-5 d-flex justify-content-center">
                    {/* Weather Component */}
                    {/* <Weather /> */}
                    <p>Weather</p>

                    <div className="row mt-4">
                        <div className="col-md-6 text-center">
                            {/* Longest Stint By Compound Table */}
                            {/* <LongestStintPerCompound /> */}
                            <p>Longest Stint</p>
                        </div>
                        <div className="col-md-6 text-center">
                            {/* Race Control Messages */}
                            {/* <RaceControl /> */}
                            <p>RC</p>
                        </div>
                    </div>
                </div>

                {/* Team Radio (Placeholder) */}
                <div className="row mt-4">
                    <div className="col-12">
                        {/* TeamRadio Component */}
                        {/* <TeamRadio /> */}
                        <p>TR</p>
                    </div>
                </div>
            </div>
            );

            {/* <Position /> */}
        </div>
    )
}

export default RaceResults