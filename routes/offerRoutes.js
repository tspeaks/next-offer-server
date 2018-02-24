const _ = require("lodash");
const Path = require("path-parser");
const { URL } = require("url");
const mongoose = require("mongoose");
const requireLogin = require("../middlewares/requireLogin");
const requireCredits = require("../middlewares/requireCredits");
const Mailer = require("../services/mailer");
const offerTemplate = require("../services/emailTemplates/offerTemplate");

const Offer = mongoose.model("offers");

module.exports = app => {
	app.get("/api/offers", requireLogin, async (req, res) => {
		const offers = await Offer.find({ _user: req.user.id }).select({
			recipients: false
		});

		res.send(offers);
	});

	app.get("/api/offers/:offerId/:choice", (req, res) => {
		res.send("Thank you for your decision!");
	});

	app.post("/api/offers/webhooks", (req, res) => {
		const p = new Path("/api/offers/:offerId/:choice");

		_.chain(req.body)
			.map(({ email, url }) => {
				const match = p.test(new URL(url).pathname);
				if (match) {
					return {
						email,
						offerId: match.offerId,
						choice: match.choice
					};
				}
			})
			.compact()
			.uniqBy("email", "offerId")
			.each(({ offerId, email, choice }) => {
				Offer.updateOne(
					{
						_id: offerId,
						recipients: {
							$elemMatch: { email: email, responded: false }
						}
					},
					{
						$inc: { [choice]: 1 },
						$set: { "recipients.$.responded": true },
						lastResponded: new Date()
					}
				).exec();
			})
			.value();

		res.send({});
	});

	app.post("/api/offers", requireLogin, requireCredits, async (req, res) => {
		const { title, subject, body, recipients } = req.body;

		const offer = new Offer({
			title,
			subject,
			body,
			recipients: recipients
				.split(",")
				.map(email => ({ email: email.trim() })),
			_user: req.user.id,
			dateSent: Date.now()
		});

		const mailer = new Mailer(offer, offerTemplate(offer));

		try {
			await mailer.send();
			await offer.save();
			req.user.credits -= 1;
			const user = await req.user.save();

			res.send(user);
		} catch (err) {
			res.status(422).send(err);
		}
	});
};
