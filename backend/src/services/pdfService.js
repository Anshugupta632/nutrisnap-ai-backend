const PDFDocument = require('pdfkit');

function generateMonthlyReport(userData, meals, avatarStats) {
  const doc = new PDFDocument({ margin: 50 });

  // Header
  doc.fontSize(24).fillColor('#C1502E').text('NutriSnap AI', { align: 'center' });
  doc.fontSize(14).fillColor('#333333').text('Monthly Nutrition Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#888888').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);

  // User Info
  doc.fontSize(14).fillColor('#000000').text('Profile Summary');
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#333333');
  doc.text(`Name: ${userData.name || 'N/A'}`);
  doc.text(`Body Type: ${userData.body_type || 'N/A'}`);
  doc.text(`Weight: ${userData.weight_kg || 'N/A'} kg`);
  doc.text(`Daily Calorie Target: ${userData.daily_calorie_target || 0} kcal`);
  doc.text(`Daily Protein Target: ${userData.daily_protein_target || 0} g`);
  doc.moveDown(1.5);

  // Avatar Stats
  doc.fontSize(14).fillColor('#000000').text('Avatar Status');
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#333333');
  doc.text(`Stamina: ${avatarStats?.stamina || 0}%`);
  doc.text(`Strength Points: ${avatarStats?.strength_points || 0}`);
  doc.text(`Protein Deficit Days: ${avatarStats?.protein_deficit_days || 0}`);
  doc.moveDown(1.5);

  // Meals Summary
  doc.fontSize(14).fillColor('#000000').text(`Meal History (${meals.length} meals logged)`);
  doc.moveDown(0.5);

  if (meals.length === 0) {
    doc.fontSize(10).fillColor('#888888').text('No meals logged this month.');
  } else {
    // Table-ish layout
    meals.forEach((meal, i) => {
      const date = new Date(meal.logged_at).toLocaleDateString();
      doc.fontSize(10).fillColor('#000000').text(
        `${i + 1}. ${date} — ${meal.meal_type.toUpperCase()} — ${meal.total_calories} kcal (P: ${meal.total_protein}g, C: ${meal.total_carbs}g, F: ${meal.total_fats}g)`
      );
      doc.moveDown(0.2);

      // Page break agar zaroori ho
      if (doc.y > 700) {
        doc.addPage();
      }
    });
  }

  // Totals
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + Number(m.total_calories),
      protein: acc.protein + Number(m.total_protein),
      carbs: acc.carbs + Number(m.total_carbs),
      fats: acc.fats + Number(m.total_fats),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  doc.moveDown(1.5);
  doc.fontSize(12).fillColor('#000000').text('Monthly Totals', { underline: true });
  doc.fontSize(10).fillColor('#333333');
  doc.text(`Total Calories: ${totals.calories} kcal`);
  doc.text(`Total Protein: ${totals.protein.toFixed(1)} g`);
  doc.text(`Total Carbs: ${totals.carbs.toFixed(1)} g`);
  doc.text(`Total Fats: ${totals.fats.toFixed(1)} g`);

  doc.end();
  return doc;
}

module.exports = { generateMonthlyReport };