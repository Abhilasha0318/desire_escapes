const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const{ listingSchema } = require("./schema.js")
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const Review = require("./models/review.js");
// Connect Mongo
main()
  .then(() => {
    console.log("✅ Connected to DB")
  })
  .catch((err) => {
     console.log("❌ DB Connection Error:", err)
    });

async function main() {
  await mongoose.connect(MONGO_URL);
}

// View engine setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// Root
app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

const validationListing = (req, res, next) => {
  let {error} = listingSchema.validate(req.body);
  
  if(error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};
// Index Route
app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const listings = await Listing.find({});
    res.render("listings/index.ejs", { listings });
  })
);

// New Route
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// Show Route
app.get(
  "/listings/:id",
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError(404, "Listing Not Found");
    res.render("listings/show.ejs", { listing });
  })
);

// Create Route
app.post(
  "/listings", 
  validationListing,
  wrapAsync(async (req, res) => {
    
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
  })
);

// Edit Route
app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");

    if (!listing) {
      return next(new ExpressError(404, "Listing not found"));
    }

    res.render("listings/edit.ejs", { listing });
  })
);

// Update Route
app.put(
  "/listings/:id",
  validationListing,
  wrapAsync(async (req, res) => {
    
    let { id } = req.params;
    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      { ...req.body.listing },
      { new: true }
    );
    res.redirect(`/listings/${updatedListing._id}`);
  })
);

// Delete Listing Route
// Delete Review Route
app.delete(
  "/listings/:id/reviews/:reviewId",
  wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;

    // 1. Delete review from Review collection
    await Review.findByIdAndDelete(reviewId);

    // 2. Remove reference from listing
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

    res.redirect(`/listings/${id}`);
  })
);


//Reviews
//Post Review Route
app.post("/listings/:id/reviews", async (req,res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review (req.body.review);

  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  console.log("new review saved");
  
  res.redirect(`/listings/${listing._id}`);
});

//Delete Review Route
app.delete("/listings/:id/reviews/:reviewId",
  wrapAsync(async (req,res) => {

  let {id, reviewId} = req.params;

  await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}})
  await Review.findByIdAnd(reviewId);


  res.redirect(`/listings/${id}`);
}) 
);

// 404 Handler
// 404 Handler (works in Express 5)
app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});


// Error Handler
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { err }); // Better than just send()
});

// Server
app.listen(8080, () => {
  console.log("🚀 Server running on port 8080");
});
