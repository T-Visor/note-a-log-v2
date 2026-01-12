import { NextRequest, NextResponse } from "next/server";
import geocoder from "local-reverse-geocoder";
import path from "path";

// The library usually needs to be initialized once
// You might want to move geocoder.init() to a separate global config
geocoder.init({
  // This will create a 'geo_data' folder in your project root
  dumpDirectory: path.join(process.cwd(), "geo_data")
});

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    // Validate input exists and is a string
    if (!latitude || !longitude) {
      return new NextResponse("Missing coordinates", { status: 400 });
    }

    console.log(`Latitude: ${latitude}`);
    console.log(`Longitude: ${longitude}`);

    const locationData = await new Promise((resolve, reject) => {
      geocoder.lookUp({ latitude, longitude }, (error, response) => {
        if (error)
          reject(error);
        else
          resolve(response);
      });
    })
    console.log(locationData);

    return NextResponse.json({ locationData });
  }
  catch (error) {
    return new NextResponse("Invalid JSON body", { status: 400 });
  }
};