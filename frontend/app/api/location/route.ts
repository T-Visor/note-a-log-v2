import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const POST = async (
  request: NextRequest
): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    if (!latitude || !longitude)
      return new NextResponse("Missing latitude or longitude", { status: 400 });

    // Call Google Geolocation API
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${
        latitude
      },${
        longitude
      }&key=${
        process.env.GOOGLE_GEOCODING_API_KEY
      }`
    );

    const getAddressPart = (
      type: string,
      nameType: "short_name" | "long_name"
    ) => {
      const component = response.data.results[0]?.address_components.find(
        (component: any) => component.types.includes(type)
      );
      return component ? component[nameType] : null;
    };

    const location = [
      getAddressPart("locality", "long_name"),
      getAddressPart("administrative_area_level_1", "long_name"),
    ].filter(Boolean) as string[]; // removes empty values from array

    return NextResponse.json(location);
  }
  catch (error) {
    return new NextResponse("Invalid JSON body", { status: 400 });
  }
};