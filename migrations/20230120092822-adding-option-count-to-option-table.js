'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("Options", "optionCount", {
      type: Sequelize.DataTypes.INTEGER,
    })

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("Options", "optionCount");
  }
};
