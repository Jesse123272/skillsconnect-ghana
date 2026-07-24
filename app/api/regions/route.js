import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const ghanaRegions = [
      {
        region: 'Greater Accra',
        districts: [
          'Accra Metropolitan',
          'Tema Metropolitan',
          'Adentan Municipal',
          'Madina (La Nkwantanang Municipal)',
          'Ashaiman Municipal',
          'East Legon',
          'Ga East',
          'Ga West',
          'Ga South',
          'Ledzokuku-Krowor',
          'La Dade-Kotopon'
        ]
      },
      {
        region: 'Ashanti',
        districts: [
          'Kumasi Metropolitan',
          'Obuasi Municipal',
          'Ejisu Municipal',
          'Mampong Municipal',
          'Asokore Mampong Municipal',
          'Bekwai Municipal',
          'Offinso Municipal',
          'Konongo (Asante Akim Central)'
        ]
      },
      {
        region: 'Eastern',
        districts: [
          'New Juaben Municipal (Koforidua)',
          'Nsawam Adoagyiri Municipal',
          'Suhum Municipal',
          'West Akim Municipal (Asamankese)',
          'Kwahu West Municipal (Nkawkaw)',
          'Yilo Krobo Municipal (Somanya)'
        ]
      },
      {
        region: 'Western',
        districts: [
          'Sekondi-Takoradi Metropolitan',
          'Tarkwa-Nsuaem Municipal',
          'Nzema East Municipal (Axim)',
          'Prestea-Huni Valley'
        ]
      },
      {
        region: 'Central',
        districts: [
          'Cape Coast Metropolitan',
          'Awutu Senya East Municipal (Kasoa)',
          'Effutu Municipal (Winneba)',
          'Mfantsiman Municipal (Saltpond)',
          'Agona West Municipal (Swedru)'
        ]
      },
      {
        region: 'Volta',
        districts: [
          'Ho Municipal',
          'Hohoe Municipal',
          'Ketu South Municipal (Aflao)',
          'Keta Municipal'
        ]
      },
      {
        region: 'Northern',
        districts: [
          'Tamale Metropolitan',
          'Savelugu Municipal',
          'Yendi Municipal'
        ]
      },
      {
        region: 'Bono',
        districts: [
          'Sunyani Municipal',
          'Berekum Municipal',
          'Techiman Municipal'
        ]
      },
      {
        region: 'Upper East',
        districts: [
          'Bolgatanga Municipal',
          'Bawku Municipal',
          'Kasena Nankana Municipal (Navrongo)'
        ]
      },
      {
        region: 'Upper West',
        districts: [
          'Wa Municipal',
          'Jirapa Municipal',
          'Lawra Municipal'
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      data: ghanaRegions
    });

  } catch (error) {
    console.error('Ghana Regions API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while retrieving geographic data' },
      { status: 500 }
    );
  }
}
