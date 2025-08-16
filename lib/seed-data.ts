import { PollutionTypeDB, SectorDB } from "./db.ts";

// Default pollution types
const defaultPollutionTypes = [
  {
    name: "Bad Smell / Odor",
    description:
      "Unpleasant odors from various sources including waste, industrial processes, or sewage",
    is_active: true,
  },
  {
    name: "Smoke",
    description:
      "Visible smoke from burning materials, vehicles, or industrial emissions",
    is_active: true,
  },
  {
    name: "Noise Pollution",
    description:
      "Excessive noise from construction, traffic, machinery, or other sources",
    is_active: true,
  },
  {
    name: "Water Pollution",
    description:
      "Contamination of water bodies including rivers, lakes, groundwater, or drainage systems",
    is_active: true,
  },
  {
    name: "Air Pollution",
    description:
      "Contamination of air quality from industrial emissions, vehicle exhaust, or other sources",
    is_active: true,
  },
  {
    name: "Waste / Litter",
    description:
      "Improper disposal of solid waste, illegal dumping, or excessive littering",
    is_active: true,
  },
  {
    name: "Chemical Pollution",
    description: "Release of hazardous chemicals into the environment",
    is_active: true,
  },
  {
    name: "Other",
    description: "Other types of pollution not covered by the above categories",
    is_active: true,
  },
];

// Default sectors
const defaultSectors = [
  {
    name: "Sector 1",
    description:
      "Residential and commercial area in the northern part of the city",
    is_active: true,
  },
  {
    name: "Sector 2",
    description: "Mixed residential and light industrial area",
    is_active: true,
  },
  {
    name: "Sector 3",
    description: "Central business district and commercial area",
    is_active: true,
  },
  {
    name: "Sector 4",
    description: "Industrial and manufacturing zone",
    is_active: true,
  },
  {
    name: "Sector 5",
    description: "Residential area in the southern part of the city",
    is_active: true,
  },
];

export async function seedDefaultData() {
  try {
    console.log("🌱 Seeding default pollution types and sectors...");

    // Check if pollution types already exist
    const existingTypes = await PollutionTypeDB.getAll();
    if (existingTypes.length === 0) {
      console.log("Creating default pollution types...");
      for (const type of defaultPollutionTypes) {
        await PollutionTypeDB.create(type);
      }
      console.log(`✅ Created ${defaultPollutionTypes.length} pollution types`);
    } else {
      console.log(
        `ℹ️  Found ${existingTypes.length} existing pollution types, skipping creation`,
      );
    }

    // Check if sectors already exist
    const existingSectors = await SectorDB.getAll();
    if (existingSectors.length === 0) {
      console.log("Creating default sectors...");
      for (const sector of defaultSectors) {
        await SectorDB.create(sector);
      }
      console.log(`✅ Created ${defaultSectors.length} sectors`);
    } else {
      console.log(
        `ℹ️  Found ${existingSectors.length} existing sectors, skipping creation`,
      );
    }

    console.log("🌱 Default data seeding completed successfully");
  } catch (error) {
    console.error("❌ Error seeding default data:", error);
    throw error;
  }
}
