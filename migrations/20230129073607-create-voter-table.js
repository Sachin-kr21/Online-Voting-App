'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Voters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: {
            args: 1,
            msg: "Proper email required!",
          },
      },
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          async checkpwd(pwd) {
            if (await bcrypt.compare("", pwd)) {
              throw new Error("Invalid password");
            }
          },
      },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Voters');
  }
};