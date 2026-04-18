import { useState } from "react";

type Location = {
  name: string;
  lat: number;
  lng: number;
};

export const LocationInput = ({
  placeholder,
  onSelect,
}: {
  placeholder: string;
  onSelect: (loc: Location) => void;
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const searchLocation = async (value: string) => {
    setQuery(value);

    if (value.length < 3) {
      setResults([]);
      return;
    }

    const res = await fetch(
      `https://photon.komoot.io/api/?q=${value}`
    );
    const data = await res.json();

    setResults(data.features);
  };

  const handleSelect = (item: any) => {
    const loc = {
      name: item.properties.name + ", " + item.properties.city,
      lat: item.geometry.coordinates[1],
      lng: item.geometry.coordinates[0],
    };

    setQuery(loc.name);
    setResults([]);
    onSelect(loc);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => searchLocation(e.target.value)}
        placeholder={placeholder}
        className="border p-2 rounded w-full"
      />

      {results.length > 0 && (
        <div className="absolute bg-white border w-full mt-1 max-h-60 overflow-y-auto z-50">
          {results.map((item, index) => (
            <div
              key={index}
              onClick={() => handleSelect(item)}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {item.properties.name}, {item.properties.city}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};