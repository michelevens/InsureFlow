<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ZipCodeSeeder extends Seeder
{
    public function run(): void
    {
        $zips = [
            // Alabama (AL)
            ['zip' => '35203', 'city' => 'Birmingham', 'state' => 'AL', 'county' => 'Jefferson', 'latitude' => 33.5186, 'longitude' => -86.8104, 'timezone' => 'America/Chicago'],
            ['zip' => '36104', 'city' => 'Montgomery', 'state' => 'AL', 'county' => 'Montgomery', 'latitude' => 32.3668, 'longitude' => -86.2999, 'timezone' => 'America/Chicago'],
            ['zip' => '35801', 'city' => 'Huntsville', 'state' => 'AL', 'county' => 'Madison', 'latitude' => 34.7304, 'longitude' => -86.5861, 'timezone' => 'America/Chicago'],
            ['zip' => '36602', 'city' => 'Mobile', 'state' => 'AL', 'county' => 'Mobile', 'latitude' => 30.6954, 'longitude' => -88.0399, 'timezone' => 'America/Chicago'],

            // Alaska (AK)
            ['zip' => '99501', 'city' => 'Anchorage', 'state' => 'AK', 'county' => 'Anchorage', 'latitude' => 61.2181, 'longitude' => -149.9003, 'timezone' => 'America/Anchorage'],
            ['zip' => '99701', 'city' => 'Fairbanks', 'state' => 'AK', 'county' => 'Fairbanks North Star', 'latitude' => 64.8378, 'longitude' => -147.7164, 'timezone' => 'America/Anchorage'],
            ['zip' => '99801', 'city' => 'Juneau', 'state' => 'AK', 'county' => 'Juneau', 'latitude' => 58.3005, 'longitude' => -134.4197, 'timezone' => 'America/Anchorage'],

            // Arizona (AZ)
            ['zip' => '85001', 'city' => 'Phoenix', 'state' => 'AZ', 'county' => 'Maricopa', 'latitude' => 33.4484, 'longitude' => -112.0740, 'timezone' => 'America/Phoenix'],
            ['zip' => '85701', 'city' => 'Tucson', 'state' => 'AZ', 'county' => 'Pima', 'latitude' => 32.2226, 'longitude' => -110.9747, 'timezone' => 'America/Phoenix'],
            ['zip' => '85281', 'city' => 'Tempe', 'state' => 'AZ', 'county' => 'Maricopa', 'latitude' => 33.4255, 'longitude' => -111.9400, 'timezone' => 'America/Phoenix'],
            ['zip' => '86001', 'city' => 'Flagstaff', 'state' => 'AZ', 'county' => 'Coconino', 'latitude' => 35.1983, 'longitude' => -111.6513, 'timezone' => 'America/Phoenix'],

            // Arkansas (AR)
            ['zip' => '72201', 'city' => 'Little Rock', 'state' => 'AR', 'county' => 'Pulaski', 'latitude' => 34.7465, 'longitude' => -92.2896, 'timezone' => 'America/Chicago'],
            ['zip' => '72701', 'city' => 'Fayetteville', 'state' => 'AR', 'county' => 'Washington', 'latitude' => 36.0822, 'longitude' => -94.1719, 'timezone' => 'America/Chicago'],
            ['zip' => '72901', 'city' => 'Fort Smith', 'state' => 'AR', 'county' => 'Sebastian', 'latitude' => 35.3859, 'longitude' => -94.3985, 'timezone' => 'America/Chicago'],

            // California (CA)
            ['zip' => '90001', 'city' => 'Los Angeles', 'state' => 'CA', 'county' => 'Los Angeles', 'latitude' => 33.9425, 'longitude' => -118.2551, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '90210', 'city' => 'Beverly Hills', 'state' => 'CA', 'county' => 'Los Angeles', 'latitude' => 34.0901, 'longitude' => -118.4065, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '94102', 'city' => 'San Francisco', 'state' => 'CA', 'county' => 'San Francisco', 'latitude' => 37.7749, 'longitude' => -122.4194, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '92101', 'city' => 'San Diego', 'state' => 'CA', 'county' => 'San Diego', 'latitude' => 32.7157, 'longitude' => -117.1611, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '95814', 'city' => 'Sacramento', 'state' => 'CA', 'county' => 'Sacramento', 'latitude' => 38.5816, 'longitude' => -121.4944, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '95101', 'city' => 'San Jose', 'state' => 'CA', 'county' => 'Santa Clara', 'latitude' => 37.3382, 'longitude' => -121.8863, 'timezone' => 'America/Los_Angeles'],

            // Colorado (CO)
            ['zip' => '80202', 'city' => 'Denver', 'state' => 'CO', 'county' => 'Denver', 'latitude' => 39.7392, 'longitude' => -104.9903, 'timezone' => 'America/Denver'],
            ['zip' => '80903', 'city' => 'Colorado Springs', 'state' => 'CO', 'county' => 'El Paso', 'latitude' => 38.8339, 'longitude' => -104.8214, 'timezone' => 'America/Denver'],
            ['zip' => '80301', 'city' => 'Boulder', 'state' => 'CO', 'county' => 'Boulder', 'latitude' => 40.0150, 'longitude' => -105.2705, 'timezone' => 'America/Denver'],

            // Connecticut (CT)
            ['zip' => '06103', 'city' => 'Hartford', 'state' => 'CT', 'county' => 'Hartford', 'latitude' => 41.7658, 'longitude' => -72.6734, 'timezone' => 'America/New_York'],
            ['zip' => '06510', 'city' => 'New Haven', 'state' => 'CT', 'county' => 'New Haven', 'latitude' => 41.3082, 'longitude' => -72.9282, 'timezone' => 'America/New_York'],
            ['zip' => '06901', 'city' => 'Stamford', 'state' => 'CT', 'county' => 'Fairfield', 'latitude' => 41.0534, 'longitude' => -73.5387, 'timezone' => 'America/New_York'],

            // Delaware (DE)
            ['zip' => '19901', 'city' => 'Dover', 'state' => 'DE', 'county' => 'Kent', 'latitude' => 39.1582, 'longitude' => -75.5244, 'timezone' => 'America/New_York'],
            ['zip' => '19801', 'city' => 'Wilmington', 'state' => 'DE', 'county' => 'New Castle', 'latitude' => 39.7391, 'longitude' => -75.5398, 'timezone' => 'America/New_York'],

            // Florida (FL)
            ['zip' => '33101', 'city' => 'Miami', 'state' => 'FL', 'county' => 'Miami-Dade', 'latitude' => 25.7617, 'longitude' => -80.1918, 'timezone' => 'America/New_York'],
            ['zip' => '33607', 'city' => 'Tampa', 'state' => 'FL', 'county' => 'Hillsborough', 'latitude' => 27.9506, 'longitude' => -82.4572, 'timezone' => 'America/New_York'],
            ['zip' => '32801', 'city' => 'Orlando', 'state' => 'FL', 'county' => 'Orange', 'latitude' => 28.5383, 'longitude' => -81.3792, 'timezone' => 'America/New_York'],
            ['zip' => '32301', 'city' => 'Tallahassee', 'state' => 'FL', 'county' => 'Leon', 'latitude' => 30.4383, 'longitude' => -84.2807, 'timezone' => 'America/New_York'],
            ['zip' => '33301', 'city' => 'Fort Lauderdale', 'state' => 'FL', 'county' => 'Broward', 'latitude' => 26.1224, 'longitude' => -80.1373, 'timezone' => 'America/New_York'],

            // Georgia (GA)
            ['zip' => '30301', 'city' => 'Atlanta', 'state' => 'GA', 'county' => 'Fulton', 'latitude' => 33.7490, 'longitude' => -84.3880, 'timezone' => 'America/New_York'],
            ['zip' => '31401', 'city' => 'Savannah', 'state' => 'GA', 'county' => 'Chatham', 'latitude' => 32.0809, 'longitude' => -81.0912, 'timezone' => 'America/New_York'],
            ['zip' => '30901', 'city' => 'Augusta', 'state' => 'GA', 'county' => 'Richmond', 'latitude' => 33.4735, 'longitude' => -81.9748, 'timezone' => 'America/New_York'],

            // Hawaii (HI)
            ['zip' => '96801', 'city' => 'Honolulu', 'state' => 'HI', 'county' => 'Honolulu', 'latitude' => 21.3069, 'longitude' => -157.8583, 'timezone' => 'Pacific/Honolulu'],
            ['zip' => '96720', 'city' => 'Hilo', 'state' => 'HI', 'county' => 'Hawaii', 'latitude' => 19.7074, 'longitude' => -155.0847, 'timezone' => 'Pacific/Honolulu'],
            ['zip' => '96753', 'city' => 'Kihei', 'state' => 'HI', 'county' => 'Maui', 'latitude' => 20.7644, 'longitude' => -156.4450, 'timezone' => 'Pacific/Honolulu'],

            // Idaho (ID)
            ['zip' => '83702', 'city' => 'Boise', 'state' => 'ID', 'county' => 'Ada', 'latitude' => 43.6150, 'longitude' => -116.2023, 'timezone' => 'America/Boise'],
            ['zip' => '83201', 'city' => 'Pocatello', 'state' => 'ID', 'county' => 'Bannock', 'latitude' => 42.8713, 'longitude' => -112.4455, 'timezone' => 'America/Boise'],
            ['zip' => '83814', 'city' => 'Coeur d Alene', 'state' => 'ID', 'county' => 'Kootenai', 'latitude' => 47.6777, 'longitude' => -116.7805, 'timezone' => 'America/Boise'],

            // Illinois (IL)
            ['zip' => '60601', 'city' => 'Chicago', 'state' => 'IL', 'county' => 'Cook', 'latitude' => 41.8819, 'longitude' => -87.6278, 'timezone' => 'America/Chicago'],
            ['zip' => '60602', 'city' => 'Chicago', 'state' => 'IL', 'county' => 'Cook', 'latitude' => 41.8827, 'longitude' => -87.6282, 'timezone' => 'America/Chicago'],
            ['zip' => '62701', 'city' => 'Springfield', 'state' => 'IL', 'county' => 'Sangamon', 'latitude' => 39.7817, 'longitude' => -89.6501, 'timezone' => 'America/Chicago'],
            ['zip' => '61602', 'city' => 'Peoria', 'state' => 'IL', 'county' => 'Peoria', 'latitude' => 40.6936, 'longitude' => -89.5890, 'timezone' => 'America/Chicago'],

            // Indiana (IN)
            ['zip' => '46201', 'city' => 'Indianapolis', 'state' => 'IN', 'county' => 'Marion', 'latitude' => 39.7684, 'longitude' => -86.1581, 'timezone' => 'America/Indiana/Indianapolis'],
            ['zip' => '46801', 'city' => 'Fort Wayne', 'state' => 'IN', 'county' => 'Allen', 'latitude' => 41.0793, 'longitude' => -85.1394, 'timezone' => 'America/Indiana/Indianapolis'],
            ['zip' => '47374', 'city' => 'Richmond', 'state' => 'IN', 'county' => 'Wayne', 'latitude' => 39.8289, 'longitude' => -84.8902, 'timezone' => 'America/Indiana/Indianapolis'],

            // Iowa (IA)
            ['zip' => '50309', 'city' => 'Des Moines', 'state' => 'IA', 'county' => 'Polk', 'latitude' => 41.5868, 'longitude' => -93.6250, 'timezone' => 'America/Chicago'],
            ['zip' => '52401', 'city' => 'Cedar Rapids', 'state' => 'IA', 'county' => 'Linn', 'latitude' => 41.9779, 'longitude' => -91.6656, 'timezone' => 'America/Chicago'],
            ['zip' => '52240', 'city' => 'Iowa City', 'state' => 'IA', 'county' => 'Johnson', 'latitude' => 41.6611, 'longitude' => -91.5302, 'timezone' => 'America/Chicago'],

            // Kansas (KS)
            ['zip' => '67202', 'city' => 'Wichita', 'state' => 'KS', 'county' => 'Sedgwick', 'latitude' => 37.6872, 'longitude' => -97.3301, 'timezone' => 'America/Chicago'],
            ['zip' => '66101', 'city' => 'Kansas City', 'state' => 'KS', 'county' => 'Wyandotte', 'latitude' => 39.1141, 'longitude' => -94.6275, 'timezone' => 'America/Chicago'],
            ['zip' => '66044', 'city' => 'Lawrence', 'state' => 'KS', 'county' => 'Douglas', 'latitude' => 38.9717, 'longitude' => -95.2353, 'timezone' => 'America/Chicago'],

            // Kentucky (KY)
            ['zip' => '40202', 'city' => 'Louisville', 'state' => 'KY', 'county' => 'Jefferson', 'latitude' => 38.2527, 'longitude' => -85.7585, 'timezone' => 'America/New_York'],
            ['zip' => '40507', 'city' => 'Lexington', 'state' => 'KY', 'county' => 'Fayette', 'latitude' => 38.0406, 'longitude' => -84.5037, 'timezone' => 'America/New_York'],
            ['zip' => '40601', 'city' => 'Frankfort', 'state' => 'KY', 'county' => 'Franklin', 'latitude' => 38.2009, 'longitude' => -84.8733, 'timezone' => 'America/New_York'],

            // Louisiana (LA)
            ['zip' => '70112', 'city' => 'New Orleans', 'state' => 'LA', 'county' => 'Orleans', 'latitude' => 29.9511, 'longitude' => -90.0715, 'timezone' => 'America/Chicago'],
            ['zip' => '70801', 'city' => 'Baton Rouge', 'state' => 'LA', 'county' => 'East Baton Rouge', 'latitude' => 30.4515, 'longitude' => -91.1871, 'timezone' => 'America/Chicago'],
            ['zip' => '71101', 'city' => 'Shreveport', 'state' => 'LA', 'county' => 'Caddo', 'latitude' => 32.5252, 'longitude' => -93.7502, 'timezone' => 'America/Chicago'],

            // Maine (ME)
            ['zip' => '04101', 'city' => 'Portland', 'state' => 'ME', 'county' => 'Cumberland', 'latitude' => 43.6591, 'longitude' => -70.2568, 'timezone' => 'America/New_York'],
            ['zip' => '04330', 'city' => 'Augusta', 'state' => 'ME', 'county' => 'Kennebec', 'latitude' => 44.3106, 'longitude' => -69.7795, 'timezone' => 'America/New_York'],
            ['zip' => '04401', 'city' => 'Bangor', 'state' => 'ME', 'county' => 'Penobscot', 'latitude' => 44.8016, 'longitude' => -68.7712, 'timezone' => 'America/New_York'],

            // Maryland (MD)
            ['zip' => '21201', 'city' => 'Baltimore', 'state' => 'MD', 'county' => 'Baltimore City', 'latitude' => 39.2904, 'longitude' => -76.6122, 'timezone' => 'America/New_York'],
            ['zip' => '20901', 'city' => 'Silver Spring', 'state' => 'MD', 'county' => 'Montgomery', 'latitude' => 39.0176, 'longitude' => -77.0286, 'timezone' => 'America/New_York'],
            ['zip' => '21401', 'city' => 'Annapolis', 'state' => 'MD', 'county' => 'Anne Arundel', 'latitude' => 38.9784, 'longitude' => -76.4922, 'timezone' => 'America/New_York'],

            // Massachusetts (MA)
            ['zip' => '02101', 'city' => 'Boston', 'state' => 'MA', 'county' => 'Suffolk', 'latitude' => 42.3601, 'longitude' => -71.0589, 'timezone' => 'America/New_York'],
            ['zip' => '02139', 'city' => 'Cambridge', 'state' => 'MA', 'county' => 'Middlesex', 'latitude' => 42.3736, 'longitude' => -71.1097, 'timezone' => 'America/New_York'],
            ['zip' => '01101', 'city' => 'Springfield', 'state' => 'MA', 'county' => 'Hampden', 'latitude' => 42.1015, 'longitude' => -72.5898, 'timezone' => 'America/New_York'],

            // Michigan (MI)
            ['zip' => '48201', 'city' => 'Detroit', 'state' => 'MI', 'county' => 'Wayne', 'latitude' => 42.3314, 'longitude' => -83.0458, 'timezone' => 'America/Detroit'],
            ['zip' => '49503', 'city' => 'Grand Rapids', 'state' => 'MI', 'county' => 'Kent', 'latitude' => 42.9634, 'longitude' => -85.6681, 'timezone' => 'America/Detroit'],
            ['zip' => '48823', 'city' => 'East Lansing', 'state' => 'MI', 'county' => 'Ingham', 'latitude' => 42.7370, 'longitude' => -84.4839, 'timezone' => 'America/Detroit'],

            // Minnesota (MN)
            ['zip' => '55401', 'city' => 'Minneapolis', 'state' => 'MN', 'county' => 'Hennepin', 'latitude' => 44.9778, 'longitude' => -93.2650, 'timezone' => 'America/Chicago'],
            ['zip' => '55101', 'city' => 'Saint Paul', 'state' => 'MN', 'county' => 'Ramsey', 'latitude' => 44.9537, 'longitude' => -93.0900, 'timezone' => 'America/Chicago'],
            ['zip' => '55901', 'city' => 'Rochester', 'state' => 'MN', 'county' => 'Olmsted', 'latitude' => 44.0121, 'longitude' => -92.4802, 'timezone' => 'America/Chicago'],

            // Mississippi (MS)
            ['zip' => '39201', 'city' => 'Jackson', 'state' => 'MS', 'county' => 'Hinds', 'latitude' => 32.2988, 'longitude' => -90.1848, 'timezone' => 'America/Chicago'],
            ['zip' => '39530', 'city' => 'Biloxi', 'state' => 'MS', 'county' => 'Harrison', 'latitude' => 30.3960, 'longitude' => -88.8853, 'timezone' => 'America/Chicago'],

            // Missouri (MO)
            ['zip' => '64101', 'city' => 'Kansas City', 'state' => 'MO', 'county' => 'Jackson', 'latitude' => 39.0997, 'longitude' => -94.5786, 'timezone' => 'America/Chicago'],
            ['zip' => '63101', 'city' => 'Saint Louis', 'state' => 'MO', 'county' => 'St. Louis City', 'latitude' => 38.6270, 'longitude' => -90.1994, 'timezone' => 'America/Chicago'],
            ['zip' => '65801', 'city' => 'Springfield', 'state' => 'MO', 'county' => 'Greene', 'latitude' => 37.2090, 'longitude' => -93.2923, 'timezone' => 'America/Chicago'],

            // Montana (MT)
            ['zip' => '59601', 'city' => 'Helena', 'state' => 'MT', 'county' => 'Lewis and Clark', 'latitude' => 46.5884, 'longitude' => -112.0245, 'timezone' => 'America/Denver'],
            ['zip' => '59101', 'city' => 'Billings', 'state' => 'MT', 'county' => 'Yellowstone', 'latitude' => 45.7833, 'longitude' => -108.5007, 'timezone' => 'America/Denver'],
            ['zip' => '59801', 'city' => 'Missoula', 'state' => 'MT', 'county' => 'Missoula', 'latitude' => 46.8721, 'longitude' => -113.9940, 'timezone' => 'America/Denver'],

            // Nebraska (NE)
            ['zip' => '68102', 'city' => 'Omaha', 'state' => 'NE', 'county' => 'Douglas', 'latitude' => 41.2565, 'longitude' => -95.9345, 'timezone' => 'America/Chicago'],
            ['zip' => '68501', 'city' => 'Lincoln', 'state' => 'NE', 'county' => 'Lancaster', 'latitude' => 40.8136, 'longitude' => -96.7026, 'timezone' => 'America/Chicago'],

            // Nevada (NV)
            ['zip' => '89101', 'city' => 'Las Vegas', 'state' => 'NV', 'county' => 'Clark', 'latitude' => 36.1699, 'longitude' => -115.1398, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '89501', 'city' => 'Reno', 'state' => 'NV', 'county' => 'Washoe', 'latitude' => 39.5296, 'longitude' => -119.8138, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '89701', 'city' => 'Carson City', 'state' => 'NV', 'county' => 'Carson City', 'latitude' => 39.1638, 'longitude' => -119.7674, 'timezone' => 'America/Los_Angeles'],

            // New Hampshire (NH)
            ['zip' => '03301', 'city' => 'Concord', 'state' => 'NH', 'county' => 'Merrimack', 'latitude' => 43.2081, 'longitude' => -71.5376, 'timezone' => 'America/New_York'],
            ['zip' => '03101', 'city' => 'Manchester', 'state' => 'NH', 'county' => 'Hillsborough', 'latitude' => 42.9956, 'longitude' => -71.4548, 'timezone' => 'America/New_York'],

            // New Jersey (NJ)
            ['zip' => '07102', 'city' => 'Newark', 'state' => 'NJ', 'county' => 'Essex', 'latitude' => 40.7357, 'longitude' => -74.1724, 'timezone' => 'America/New_York'],
            ['zip' => '08601', 'city' => 'Trenton', 'state' => 'NJ', 'county' => 'Mercer', 'latitude' => 40.2171, 'longitude' => -74.7429, 'timezone' => 'America/New_York'],
            ['zip' => '07030', 'city' => 'Hoboken', 'state' => 'NJ', 'county' => 'Hudson', 'latitude' => 40.7440, 'longitude' => -74.0324, 'timezone' => 'America/New_York'],

            // New Mexico (NM)
            ['zip' => '87101', 'city' => 'Albuquerque', 'state' => 'NM', 'county' => 'Bernalillo', 'latitude' => 35.0844, 'longitude' => -106.6504, 'timezone' => 'America/Denver'],
            ['zip' => '87501', 'city' => 'Santa Fe', 'state' => 'NM', 'county' => 'Santa Fe', 'latitude' => 35.6870, 'longitude' => -105.9378, 'timezone' => 'America/Denver'],
            ['zip' => '88001', 'city' => 'Las Cruces', 'state' => 'NM', 'county' => 'Dona Ana', 'latitude' => 32.3199, 'longitude' => -106.7637, 'timezone' => 'America/Denver'],

            // New York (NY)
            ['zip' => '10001', 'city' => 'New York', 'state' => 'NY', 'county' => 'New York', 'latitude' => 40.7484, 'longitude' => -73.9967, 'timezone' => 'America/New_York'],
            ['zip' => '10036', 'city' => 'New York', 'state' => 'NY', 'county' => 'New York', 'latitude' => 40.7590, 'longitude' => -73.9845, 'timezone' => 'America/New_York'],
            ['zip' => '11201', 'city' => 'Brooklyn', 'state' => 'NY', 'county' => 'Kings', 'latitude' => 40.6936, 'longitude' => -73.9898, 'timezone' => 'America/New_York'],
            ['zip' => '14201', 'city' => 'Buffalo', 'state' => 'NY', 'county' => 'Erie', 'latitude' => 42.8864, 'longitude' => -78.8784, 'timezone' => 'America/New_York'],
            ['zip' => '12207', 'city' => 'Albany', 'state' => 'NY', 'county' => 'Albany', 'latitude' => 42.6526, 'longitude' => -73.7562, 'timezone' => 'America/New_York'],

            // North Carolina (NC)
            ['zip' => '28202', 'city' => 'Charlotte', 'state' => 'NC', 'county' => 'Mecklenburg', 'latitude' => 35.2271, 'longitude' => -80.8431, 'timezone' => 'America/New_York'],
            ['zip' => '27601', 'city' => 'Raleigh', 'state' => 'NC', 'county' => 'Wake', 'latitude' => 35.7796, 'longitude' => -78.6382, 'timezone' => 'America/New_York'],
            ['zip' => '27401', 'city' => 'Greensboro', 'state' => 'NC', 'county' => 'Guilford', 'latitude' => 36.0726, 'longitude' => -79.7920, 'timezone' => 'America/New_York'],

            // North Dakota (ND)
            ['zip' => '58501', 'city' => 'Bismarck', 'state' => 'ND', 'county' => 'Burleigh', 'latitude' => 46.8083, 'longitude' => -100.7837, 'timezone' => 'America/Chicago'],
            ['zip' => '58102', 'city' => 'Fargo', 'state' => 'ND', 'county' => 'Cass', 'latitude' => 46.8772, 'longitude' => -96.7898, 'timezone' => 'America/Chicago'],

            // Ohio (OH)
            ['zip' => '43215', 'city' => 'Columbus', 'state' => 'OH', 'county' => 'Franklin', 'latitude' => 39.9612, 'longitude' => -83.0007, 'timezone' => 'America/New_York'],
            ['zip' => '44101', 'city' => 'Cleveland', 'state' => 'OH', 'county' => 'Cuyahoga', 'latitude' => 41.4993, 'longitude' => -81.6944, 'timezone' => 'America/New_York'],
            ['zip' => '45202', 'city' => 'Cincinnati', 'state' => 'OH', 'county' => 'Hamilton', 'latitude' => 39.1031, 'longitude' => -84.5120, 'timezone' => 'America/New_York'],

            // Oklahoma (OK)
            ['zip' => '73102', 'city' => 'Oklahoma City', 'state' => 'OK', 'county' => 'Oklahoma', 'latitude' => 35.4676, 'longitude' => -97.5164, 'timezone' => 'America/Chicago'],
            ['zip' => '74103', 'city' => 'Tulsa', 'state' => 'OK', 'county' => 'Tulsa', 'latitude' => 36.1540, 'longitude' => -95.9928, 'timezone' => 'America/Chicago'],
            ['zip' => '73071', 'city' => 'Norman', 'state' => 'OK', 'county' => 'Cleveland', 'latitude' => 35.2226, 'longitude' => -97.4395, 'timezone' => 'America/Chicago'],

            // Oregon (OR)
            ['zip' => '97201', 'city' => 'Portland', 'state' => 'OR', 'county' => 'Multnomah', 'latitude' => 45.5152, 'longitude' => -122.6784, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '97301', 'city' => 'Salem', 'state' => 'OR', 'county' => 'Marion', 'latitude' => 44.9429, 'longitude' => -123.0351, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '97401', 'city' => 'Eugene', 'state' => 'OR', 'county' => 'Lane', 'latitude' => 44.0521, 'longitude' => -123.0868, 'timezone' => 'America/Los_Angeles'],

            // Pennsylvania (PA)
            ['zip' => '19101', 'city' => 'Philadelphia', 'state' => 'PA', 'county' => 'Philadelphia', 'latitude' => 39.9526, 'longitude' => -75.1652, 'timezone' => 'America/New_York'],
            ['zip' => '15201', 'city' => 'Pittsburgh', 'state' => 'PA', 'county' => 'Allegheny', 'latitude' => 40.4406, 'longitude' => -79.9959, 'timezone' => 'America/New_York'],
            ['zip' => '17101', 'city' => 'Harrisburg', 'state' => 'PA', 'county' => 'Dauphin', 'latitude' => 40.2732, 'longitude' => -76.8867, 'timezone' => 'America/New_York'],

            // Rhode Island (RI)
            ['zip' => '02901', 'city' => 'Providence', 'state' => 'RI', 'county' => 'Providence', 'latitude' => 41.8240, 'longitude' => -71.4128, 'timezone' => 'America/New_York'],
            ['zip' => '02840', 'city' => 'Newport', 'state' => 'RI', 'county' => 'Newport', 'latitude' => 41.4901, 'longitude' => -71.3128, 'timezone' => 'America/New_York'],

            // South Carolina (SC)
            ['zip' => '29201', 'city' => 'Columbia', 'state' => 'SC', 'county' => 'Richland', 'latitude' => 34.0007, 'longitude' => -81.0348, 'timezone' => 'America/New_York'],
            ['zip' => '29401', 'city' => 'Charleston', 'state' => 'SC', 'county' => 'Charleston', 'latitude' => 32.7765, 'longitude' => -79.9311, 'timezone' => 'America/New_York'],
            ['zip' => '29601', 'city' => 'Greenville', 'state' => 'SC', 'county' => 'Greenville', 'latitude' => 34.8526, 'longitude' => -82.3940, 'timezone' => 'America/New_York'],

            // South Dakota (SD)
            ['zip' => '57101', 'city' => 'Sioux Falls', 'state' => 'SD', 'county' => 'Minnehaha', 'latitude' => 43.5446, 'longitude' => -96.7311, 'timezone' => 'America/Chicago'],
            ['zip' => '57701', 'city' => 'Rapid City', 'state' => 'SD', 'county' => 'Pennington', 'latitude' => 44.0805, 'longitude' => -103.2310, 'timezone' => 'America/Denver'],

            // Tennessee (TN)
            ['zip' => '37201', 'city' => 'Nashville', 'state' => 'TN', 'county' => 'Davidson', 'latitude' => 36.1627, 'longitude' => -86.7816, 'timezone' => 'America/Chicago'],
            ['zip' => '38103', 'city' => 'Memphis', 'state' => 'TN', 'county' => 'Shelby', 'latitude' => 35.1495, 'longitude' => -90.0490, 'timezone' => 'America/Chicago'],
            ['zip' => '37902', 'city' => 'Knoxville', 'state' => 'TN', 'county' => 'Knox', 'latitude' => 35.9606, 'longitude' => -83.9207, 'timezone' => 'America/New_York'],

            // Texas (TX)
            ['zip' => '75201', 'city' => 'Dallas', 'state' => 'TX', 'county' => 'Dallas', 'latitude' => 32.7767, 'longitude' => -96.7970, 'timezone' => 'America/Chicago'],
            ['zip' => '77001', 'city' => 'Houston', 'state' => 'TX', 'county' => 'Harris', 'latitude' => 29.7604, 'longitude' => -95.3698, 'timezone' => 'America/Chicago'],
            ['zip' => '78201', 'city' => 'San Antonio', 'state' => 'TX', 'county' => 'Bexar', 'latitude' => 29.4241, 'longitude' => -98.4936, 'timezone' => 'America/Chicago'],
            ['zip' => '73301', 'city' => 'Austin', 'state' => 'TX', 'county' => 'Travis', 'latitude' => 30.2672, 'longitude' => -97.7431, 'timezone' => 'America/Chicago'],
            ['zip' => '76102', 'city' => 'Fort Worth', 'state' => 'TX', 'county' => 'Tarrant', 'latitude' => 32.7555, 'longitude' => -97.3308, 'timezone' => 'America/Chicago'],
            ['zip' => '79901', 'city' => 'El Paso', 'state' => 'TX', 'county' => 'El Paso', 'latitude' => 31.7619, 'longitude' => -106.4850, 'timezone' => 'America/Denver'],

            // Utah (UT)
            ['zip' => '84101', 'city' => 'Salt Lake City', 'state' => 'UT', 'county' => 'Salt Lake', 'latitude' => 40.7608, 'longitude' => -111.8910, 'timezone' => 'America/Denver'],
            ['zip' => '84601', 'city' => 'Provo', 'state' => 'UT', 'county' => 'Utah', 'latitude' => 40.2338, 'longitude' => -111.6585, 'timezone' => 'America/Denver'],
            ['zip' => '84401', 'city' => 'Ogden', 'state' => 'UT', 'county' => 'Weber', 'latitude' => 41.2230, 'longitude' => -111.9738, 'timezone' => 'America/Denver'],

            // Vermont (VT)
            ['zip' => '05401', 'city' => 'Burlington', 'state' => 'VT', 'county' => 'Chittenden', 'latitude' => 44.4759, 'longitude' => -73.2121, 'timezone' => 'America/New_York'],
            ['zip' => '05602', 'city' => 'Montpelier', 'state' => 'VT', 'county' => 'Washington', 'latitude' => 44.2601, 'longitude' => -72.5754, 'timezone' => 'America/New_York'],

            // Virginia (VA)
            ['zip' => '23219', 'city' => 'Richmond', 'state' => 'VA', 'county' => 'Richmond City', 'latitude' => 37.5407, 'longitude' => -77.4360, 'timezone' => 'America/New_York'],
            ['zip' => '23510', 'city' => 'Norfolk', 'state' => 'VA', 'county' => 'Norfolk City', 'latitude' => 36.8508, 'longitude' => -76.2859, 'timezone' => 'America/New_York'],
            ['zip' => '22201', 'city' => 'Arlington', 'state' => 'VA', 'county' => 'Arlington', 'latitude' => 38.8816, 'longitude' => -77.0910, 'timezone' => 'America/New_York'],

            // Washington (WA)
            ['zip' => '98101', 'city' => 'Seattle', 'state' => 'WA', 'county' => 'King', 'latitude' => 47.6062, 'longitude' => -122.3321, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '99201', 'city' => 'Spokane', 'state' => 'WA', 'county' => 'Spokane', 'latitude' => 47.6588, 'longitude' => -117.4260, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '98401', 'city' => 'Tacoma', 'state' => 'WA', 'county' => 'Pierce', 'latitude' => 47.2529, 'longitude' => -122.4443, 'timezone' => 'America/Los_Angeles'],

            // West Virginia (WV)
            ['zip' => '25301', 'city' => 'Charleston', 'state' => 'WV', 'county' => 'Kanawha', 'latitude' => 38.3498, 'longitude' => -81.6326, 'timezone' => 'America/New_York'],
            ['zip' => '26003', 'city' => 'Wheeling', 'state' => 'WV', 'county' => 'Ohio', 'latitude' => 40.0640, 'longitude' => -80.7209, 'timezone' => 'America/New_York'],

            // Wisconsin (WI)
            ['zip' => '53202', 'city' => 'Milwaukee', 'state' => 'WI', 'county' => 'Milwaukee', 'latitude' => 43.0389, 'longitude' => -87.9065, 'timezone' => 'America/Chicago'],
            ['zip' => '53701', 'city' => 'Madison', 'state' => 'WI', 'county' => 'Dane', 'latitude' => 43.0731, 'longitude' => -89.4012, 'timezone' => 'America/Chicago'],
            ['zip' => '54301', 'city' => 'Green Bay', 'state' => 'WI', 'county' => 'Brown', 'latitude' => 44.5133, 'longitude' => -88.0133, 'timezone' => 'America/Chicago'],

            // Wyoming (WY)
            ['zip' => '82001', 'city' => 'Cheyenne', 'state' => 'WY', 'county' => 'Laramie', 'latitude' => 41.1400, 'longitude' => -104.8202, 'timezone' => 'America/Denver'],
            ['zip' => '82601', 'city' => 'Casper', 'state' => 'WY', 'county' => 'Natrona', 'latitude' => 42.8501, 'longitude' => -106.3252, 'timezone' => 'America/Denver'],
            ['zip' => '82070', 'city' => 'Laramie', 'state' => 'WY', 'county' => 'Albany', 'latitude' => 41.3114, 'longitude' => -105.5911, 'timezone' => 'America/Denver'],

            // Washington DC
            ['zip' => '20001', 'city' => 'Washington', 'state' => 'DC', 'county' => 'District of Columbia', 'latitude' => 38.9072, 'longitude' => -77.0369, 'timezone' => 'America/New_York'],
            ['zip' => '20037', 'city' => 'Washington', 'state' => 'DC', 'county' => 'District of Columbia', 'latitude' => 38.9025, 'longitude' => -77.0531, 'timezone' => 'America/New_York'],

            // Additional popular cities / suburban ZIPs for better coverage
            ['zip' => '30303', 'city' => 'Atlanta', 'state' => 'GA', 'county' => 'Fulton', 'latitude' => 33.7537, 'longitude' => -84.3901, 'timezone' => 'America/New_York'],
            ['zip' => '60611', 'city' => 'Chicago', 'state' => 'IL', 'county' => 'Cook', 'latitude' => 41.8929, 'longitude' => -87.6244, 'timezone' => 'America/Chicago'],
            ['zip' => '90012', 'city' => 'Los Angeles', 'state' => 'CA', 'county' => 'Los Angeles', 'latitude' => 34.0622, 'longitude' => -118.2400, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '33139', 'city' => 'Miami Beach', 'state' => 'FL', 'county' => 'Miami-Dade', 'latitude' => 25.7907, 'longitude' => -80.1300, 'timezone' => 'America/New_York'],
            ['zip' => '75001', 'city' => 'Addison', 'state' => 'TX', 'county' => 'Dallas', 'latitude' => 32.9612, 'longitude' => -96.8292, 'timezone' => 'America/Chicago'],
            ['zip' => '10013', 'city' => 'New York', 'state' => 'NY', 'county' => 'New York', 'latitude' => 40.7209, 'longitude' => -74.0046, 'timezone' => 'America/New_York'],
            ['zip' => '85251', 'city' => 'Scottsdale', 'state' => 'AZ', 'county' => 'Maricopa', 'latitude' => 33.4942, 'longitude' => -111.9261, 'timezone' => 'America/Phoenix'],
            ['zip' => '37203', 'city' => 'Nashville', 'state' => 'TN', 'county' => 'Davidson', 'latitude' => 36.1509, 'longitude' => -86.7960, 'timezone' => 'America/Chicago'],
            ['zip' => '80204', 'city' => 'Denver', 'state' => 'CO', 'county' => 'Denver', 'latitude' => 39.7354, 'longitude' => -105.0201, 'timezone' => 'America/Denver'],
            ['zip' => '98102', 'city' => 'Seattle', 'state' => 'WA', 'county' => 'King', 'latitude' => 47.6299, 'longitude' => -122.3212, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '02116', 'city' => 'Boston', 'state' => 'MA', 'county' => 'Suffolk', 'latitude' => 42.3495, 'longitude' => -71.0771, 'timezone' => 'America/New_York'],
            ['zip' => '19103', 'city' => 'Philadelphia', 'state' => 'PA', 'county' => 'Philadelphia', 'latitude' => 39.9528, 'longitude' => -75.1735, 'timezone' => 'America/New_York'],
            ['zip' => '55402', 'city' => 'Minneapolis', 'state' => 'MN', 'county' => 'Hennepin', 'latitude' => 44.9740, 'longitude' => -93.2752, 'timezone' => 'America/Chicago'],
            ['zip' => '46204', 'city' => 'Indianapolis', 'state' => 'IN', 'county' => 'Marion', 'latitude' => 39.7684, 'longitude' => -86.1581, 'timezone' => 'America/Indiana/Indianapolis'],
            ['zip' => '89109', 'city' => 'Las Vegas', 'state' => 'NV', 'county' => 'Clark', 'latitude' => 36.1215, 'longitude' => -115.1524, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '29403', 'city' => 'Charleston', 'state' => 'SC', 'county' => 'Charleston', 'latitude' => 32.7904, 'longitude' => -79.9373, 'timezone' => 'America/New_York'],
            ['zip' => '97209', 'city' => 'Portland', 'state' => 'OR', 'county' => 'Multnomah', 'latitude' => 45.5316, 'longitude' => -122.6831, 'timezone' => 'America/Los_Angeles'],
            ['zip' => '28801', 'city' => 'Asheville', 'state' => 'NC', 'county' => 'Buncombe', 'latitude' => 35.5951, 'longitude' => -82.5515, 'timezone' => 'America/New_York'],
            ['zip' => '84111', 'city' => 'Salt Lake City', 'state' => 'UT', 'county' => 'Salt Lake', 'latitude' => 40.7572, 'longitude' => -111.8768, 'timezone' => 'America/Denver'],
            ['zip' => '40206', 'city' => 'Louisville', 'state' => 'KY', 'county' => 'Jefferson', 'latitude' => 38.2495, 'longitude' => -85.7069, 'timezone' => 'America/New_York'],
        ];

        $now = now();

        // Use upsert to avoid duplicates on re-run
        foreach (array_chunk($zips, 50) as $chunk) {
            $rows = array_map(fn($z) => array_merge($z, ['created_at' => $now, 'updated_at' => $now]), $chunk);
            DB::table('zip_codes')->upsert($rows, ['zip', 'city', 'state'], ['county', 'latitude', 'longitude', 'timezone', 'updated_at']);
        }
    }
}
