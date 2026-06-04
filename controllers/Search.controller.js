const Hall = require("../models/Hall.model");

const SearchHalls = async (req, res) => {
  try {
    const {
      keyword,
      city,
      hallType,
      minPrice,
      maxPrice,
      capacity,
      sort,
      page,
      limit
    } = req.query;

    let filter = {
      status: "approved"
    };

    if (keyword) {
      filter.$or = [
        {
          name: {
            $regex: keyword,
            $options: "i"
          }
        },
        {
          description: {
            $regex: keyword,
            $options: "i"
          }
        },
        {
          hallType: {
            $regex: keyword,
            $options: "i"
          }
        }
      ];
    }

    if (city) {
      filter["location.city"] = {
        $regex: city,
        $options: "i"
      };
    }

    if (hallType) {
      filter.hallType = hallType;
    }

    if (capacity) {
      filter.capacity = {
        $gte: Number(capacity)
      };
    }

    if (minPrice || maxPrice) {
      filter.availableSlots = {
        $elemMatch: {
          price: {
            ...(minPrice && {
              $gte: Number(minPrice)
            }),
            ...(maxPrice && {
              $lte: Number(maxPrice)
            })
          }
        }
      };
    }

    const sortMap = {
      price: {
        startingPrice: 1
      },
      "-price": {
        startingPrice: -1
      },
      rating: {
        rating: -1
      },
      newest: {
        createdAt: -1
      }
    };

    const sortOption = sortMap[sort] || {
      createdAt: -1
    };

    const currentPage = Math.max(
      Number(page) || 1,
      1
    );

    const currentLimit = Math.min(
      Math.max(Number(limit) || 10, 1),
      50
    );

    const skip = (currentPage - 1) * currentLimit;

    const halls = await Hall.find(filter)
      .populate(
        "provider",
        "name email"
      )
      .sort(sortOption)
      .skip(skip)
      .limit(currentLimit);

    const total = await Hall.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Halls fetched successfully",
      pagination: {
        total,
        currentPage,
        currentLimit,
        totalPages: Math.ceil(
          total / currentLimit
        )
      },
      halls
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

module.exports = { SearchHalls };