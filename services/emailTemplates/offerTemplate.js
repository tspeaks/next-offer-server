const keys = require('../../config/keys');

module.exports = offer => {
	return `
		<html>
			<body>
				<div style="text-align: center;">
					<h2>Don't miss this Offer!</h2>
					<p>Our next release is around the corner.</p>
					<p>${offer.body}</p>
					<div>
						<a href="${keys.redirectDomain}/api/offers/${offer.id}/accept">Yes</a>
					</div>
					<div>
						<a href="${keys.redirectDomain}/api/offers/${offer.id}/decline">No</a>
					</div>
				</div>
			</body>
		</html>
	`;
};
