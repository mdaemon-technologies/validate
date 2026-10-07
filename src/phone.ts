/*
*    Copyright (C) 1998-2026  MDaemon Technologies, Ltd.
*
*    This library is free software; you can redistribute it and/or
*    modify it under the terms of the GNU Lesser General Public
*    License as published by the Free Software Foundation; either
*    version 2.1 of the License, or (at your option) any later version.
*
*    This library is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
*    Lesser General Public License for more details.
*
*    You should have received a copy of the GNU Lesser General Public
*    License along with this library; if not, write to the Free Software
*    Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301
*    USA
*/

/**
* Validates if a given string is a valid phone number.
*
* @param {string} str - The string to validate.
* @returns {boolean} True if the string is a valid phone number, false otherwise.
*/
export function validatePhoneNumber(str: string): boolean {
  return typeof str === "string" && /^\+?[0-9)( -]{5,20}$/.test(str) && (str.match(/\d/g) ?? []).length >= 5;
}
