import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

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

    const bigDataCloudAPIURL = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const response = await axios.get(bigDataCloudAPIURL);

    const parsedlocationTag = parseCleanLocationTag(response.data);
    console.log(parsedlocationTag);

    return NextResponse.json({ location: parsedlocationTag });
  }
  catch (error) {
    return new NextResponse("Invalid JSON body", { status: 400 });
  }
};

const parseCleanLocationTag = (bigDataCloudAPIResponse: any) => {
  const locality = bigDataCloudAPIResponse.city || bigDataCloudAPIResponse.locality;
  const state = bigDataCloudAPIResponse.principalSubdivision;
  const countryCode = bigDataCloudAPIResponse.countryCode;

  if (countryCode === "US") {
    return `${locality}, ${state}`
  }
  else{
    return `${locality}, ${state}, ${countryCode}`;
  }
};