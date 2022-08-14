'use strict';

const { Op } = require("sequelize");

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Users', [
      {
        pseudo: 'test1',
        email: 'test1@wanadoo.fr',
        password: '$2b$10$6EjbTpE9iSTaLp3ubMwyE..kzq44pZkGO1AZYxipLvary0evxevD2',
        invited: null,
        invitedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
        
      },
      {
        pseudo: 'test2',
        email: 'test2@wanadoo.fr',
        password: '$2b$10$6EjbTpE9iSTaLp3ubMwyE..kzq44pZkGO1AZYxipLvary0evxevD2',
        invited: ['Whitedog44', 'tata', 'tutu'],
        invitedBy: ['tata', 'tutu', 'coco_lastico'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        pseudo: 'test3',
        email: 'test3@wanadoo.fr',
        password: '$2b$10$6EjbTpE9iSTaLp3ubMwyE..kzq44pZkGO1AZYxipLvary0evxevD2',
        invited: ['toto', 'Whitedog44', 'tutu'],
        invitedBy: ['Whitedog44', 'Tata', 'coco_lastico', 'coco_lasticot'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        pseudo: 'test4',
        email: 'test4@wanadoo.fr',
        password: '$2b$10$6EjbTpE9iSTaLp3ubMwyE..kzq44pZkGO1AZYxipLvary0evxevD2',
        invited: ['toto', 'tata', 'tutu', 'Whitedog44'],
        invitedBy: ['Whitedog44'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        pseudo: 'test5',
        email: 'test5@wanadoo.fr',
        password: '$2b$10$6EjbTpE9iSTaLp3ubMwyE..kzq44pZkGO1AZYxipLvary0evxevD2',
        invited: ['tutu', 'tata'],
        invitedBy: ['toto', 'Whitedog44', 'coco_lasticot'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
