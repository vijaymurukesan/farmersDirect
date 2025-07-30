// Example product details JSON
export const productDetails = {
  _id: "688667f76dec8f5a89a8444f",
  title: "Banana",
  type: "fruit",
  category: "non-organic",
  images: [
    "https://example.com/images/banana1.jpg",
    "https://example.com/images/banana2.jpg"
  ],
  videos: [
    "https://example.com/videos/banana-harvest.mp4"
  ],
  description: "This is banana.",
  price: 2.99,
  productId: "2",
  farmers: [
    {
      contactPerson: "Amit Patel",
      companyName: "Patel Banana Farms",
      gstRegistered: true,
      isRegisteredCompany: true,
      totalAreaOfCultivation: "20 acres",
      totalYield: "25000 kg/year",
      availability: {
        today: true,
        expectedDate: "2024-07-12"
      },
      size: "extra large",
      organicCertificate: "",
      address: "Village Navsari, District Navsari, Gujarat, India",
      mapLocation: {
        lat: 20.9467,
        lng: 72.9520
      },
      review: "Reliable supplier of bananas for local and export markets.",
      totalSuccessForDelivery: 120,
      readyForContract: true,
      totalContractWithdrawal: 3,
      price: 2.99,
      images: [
        "https://example.com/images/farmer3.jpg"
      ],
      videos: [
        "https://example.com/videos/farmer3-interview.mp4"
      ]
    },
    {
      contactPerson: "Meena Reddy",
      companyName: "Reddy Agro",
      gstRegistered: false,
      isRegisteredCompany: false,
      totalAreaOfCultivation: "7 acres",
      totalYield: "8000 kg/year",
      availability: {
        today: false,
        expectedDate: "2024-07-18"
      },
      size: "medium",
      organicCertificate: "",
      address: "Village Nandyal, District Kurnool, Andhra Pradesh, India",
      mapLocation: {
        lat: 15.4887,
        lng: 78.4867
      },
      review: "Fresh bananas, quick delivery, good feedback from buyers.",
      totalSuccessForDelivery: 60,
      readyForContract: false,
      totalContractWithdrawal: 0,
      price: 3.1,
      images: [
        "https://example.com/images/farmer4.jpg"
      ],
      videos: []
    }
  ]
};
